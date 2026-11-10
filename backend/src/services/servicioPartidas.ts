/**
 * Archivo: servicioPartidas.ts
 * Módulo: backend / services
 * Descripción: Lógica de negocio de las partidas: validación, experiencia, Bits, logros y
 *              sincronización idempotente.
 * Requerimientos: RF46, RF48, RF55, RF56, RF58, RF60, RF62
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import type { BaseDatos } from '../config/baseDatos.js'
import { prohibido } from '../middleware/autenticacion.js'
import { ErrorAplicacion, noEncontrado } from '../models/errores.js'
import { evaluarLogros } from '../models/logros.js'
import { calcularNivel } from '../models/reglas.js'
import { esquemaPartida } from '../models/esquemas.js'
import { analizar } from '../models/validacion.js'
import { resumenLogros, desbloquearLogros } from '../repositories/repositorioLogros.js'
import { buscarDuenoPartida, insertarPartida } from '../repositories/repositorioPartidas.js'
import { agregarRecompensas, buscarJugadorPorId } from '../repositories/repositorioJugadores.js'

// ---------- Tipos ----------
export type EstadoGuardado = 'created' | 'duplicate'

export interface ResultadoSincronizacion {
  id: string | null
  estatus: EstadoGuardado | 'rejected'
  error?: { codigo: string; mensaje: string; detalles?: unknown }
}

// ---------- Servicio ----------
/**
 * Guarda una partida terminada, suma sus recompensas y desbloquea los logros que correspondan. Es
 * idempotente: reenviar la misma partida no crea otra copia ni vuelve a sumar experiencia, Bits o
 * logros (secciones 4.3, 9.3 y 13.4). Solo el jugador autenticado (`idDueno`) puede guardar sus
 * partidas.
 * @param baseDatos Conexión con la base de datos o transacción en curso
 * @param datosEntrada Cuerpo de la solicitud, todavía sin validar
 * @param idDueno Jugador autenticado que envía las partidas
 * @returns Id de la partida y si se creó o ya existía
 * @see RF46, RF48, RF56, RF58, RF60, RF62
 */
export async function guardarPartida(
  baseDatos: BaseDatos,
  datosEntrada: unknown,
  idDueno: string,
): Promise<{ id: string; estatus: EstadoGuardado }> {
  const juego = analizar(esquemaPartida, datosEntrada, 'La partida no es válida.')
  if (juego.jugadorId !== idDueno) {
    throw prohibido()
  }
  if (!(await buscarJugadorPorId(baseDatos, juego.jugadorId))) {
    throw noEncontrado('No existe el jugador de la partida.')
  }

  const estaCreada = await baseDatos.transaccion(async (ejecutorTransaccion) => {
    const estaInsertada = await insertarPartida(ejecutorTransaccion, juego)
    if (!estaInsertada) {
      return false
    }
    await agregarRecompensas(
      ejecutorTransaccion,
      juego.jugadorId,
      { xp: juego.xpObtenida, bits: juego.bitsObtenidos ?? 0 },
      calcularNivel,
    )
    await desbloquearLogros(
      ejecutorTransaccion,
      juego.jugadorId,
      evaluarLogros(await resumenLogros(ejecutorTransaccion, juego.jugadorId)),
    )
    return true
  })
  if (estaCreada) {
    return { id: juego.id, estatus: 'created' }
  }

  const dueno = await buscarDuenoPartida(baseDatos, juego.id)
  if (dueno !== juego.jugadorId) {
    throw new ErrorAplicacion(
      409,
      'id-conflict',
      'El identificador de la partida pertenece a otro jugador.',
    )
  }
  return { id: juego.id, estatus: 'duplicate' }
}

/**
 * Procesa un lote; cada partida se confirma o rechaza por separado
 * @param baseDatos Conexión con la base de datos o transacción en curso
 * @param partidas Partidas del lote, todavía sin validar
 * @param idDueno Jugador autenticado que envía las partidas
 * @returns Resultado de cada partida del lote
 * @see RF55, RF58, RF62
 */
export async function sincronizarPartidas(
  baseDatos: BaseDatos,
  partidas: unknown[],
  idDueno: string,
): Promise<ResultadoSincronizacion[]> {
  const resultados: ResultadoSincronizacion[] = []
  for (const datosEntrada of partidas) {
    const id =
      typeof datosEntrada === 'object' &&
      datosEntrada !== null &&
      typeof (datosEntrada as { id?: unknown }).id === 'string'
        ? (datosEntrada as { id: string }).id
        : null
    try {
      resultados.push(await guardarPartida(baseDatos, datosEntrada, idDueno))
    } catch (errorCapturado) {
      if (!(errorCapturado instanceof ErrorAplicacion)) {
        throw errorCapturado
      }
      resultados.push({
        id,
        estatus: 'rejected',
        error: {
          codigo: errorCapturado.codigo,
          mensaje: errorCapturado.message,
          detalles: errorCapturado.detalles,
        },
      })
    }
  }
  return resultados
}
