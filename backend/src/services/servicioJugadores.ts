/**
 * Archivo: servicioJugadores.ts
 * Módulo: backend / services
 * Descripción: Lógica de negocio de los jugadores: registro, perfil con progreso, historial,
 *              estadísticas y compras.
 * Requerimientos: RF01, RF02, RF47, RF49, RF51, RF57
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import type { BaseDatos } from '../config/baseDatos.js'
import { cifrarToken } from '../models/autenticacion.js'
import { ErrorAplicacion, noEncontrado } from '../models/errores.js'
import { PRECIOS_ARTICULOS, type IdArticulo } from '../models/cosmeticos.js'
import { generarCodigoRecuperacion, cifrarCodigoRecuperacion } from '../models/recuperacion.js'
import { IDS_JUEGOS, xpParaSiguienteNivel } from '../models/reglas.js'
import { type DatosCrearJugador, normalizarUsername } from '../models/esquemas.js'
import { contarLogros, listarLogros } from '../repositories/repositorioLogros.js'
import {
  contarPartidasPorResultado,
  listarPartidas,
  type FilaPartida,
} from '../repositories/repositorioPartidas.js'
import { insertarArticulo, listarArticulos } from '../repositories/repositorioArticulos.js'
import {
  buscarJugadorPorId,
  buscarJugadorPorUsername,
  insertarJugador,
  type FilaJugador,
  type JugadorConProgreso,
  asignarHashRecuperacion,
  gastarBits,
} from '../repositories/repositorioJugadores.js'
import { agregarToken, contarTokens, buscarDuenoToken } from '../repositories/repositorioTokens.js'

// ---------- Tipos ----------
export interface JugadorDto {
  id: string
  username: string
  avatar: string
  creadoEn: string
}

// ---------- Servicio ----------
const aJugadorDto = (fila: FilaJugador): JugadorDto => ({
  id: fila.id,
  username: fila.username,
  avatar: fila.avatar,
  creadoEn: fila.creado_en.toISOString(),
})

const tokenEnUso = () =>
  new ErrorAplicacion(409, 'token-taken', 'Ese token ya pertenece a otro jugador.')

const usernameOcupado = () =>
  new ErrorAplicacion(409, 'username-taken', 'Ese nombre ya está en uso.')

/**
 * Registra un jugador y el token del dispositivo. Si llega un `id` que ya existe con el mismo
 * nombre: - con el mismo token es un reintento y devuelve el registro existente, sin duplicados; -
 * si el perfil aún no tiene tokens (se creó antes de existir la autenticación), lo reclama este
 * dispositivo; - si ya pertenece a otro dispositivo responde 409 `profile-claimed`: hay que
 * recuperarlo con el código. Al crearlo devuelve, una sola vez, el código secreto para recuperar el
 * perfil.
 * @param baseDatos Conexión con la base de datos o transacción en curso
 * @param datosEntrada Cuerpo de la solicitud, todavía sin validar
 * @returns Jugador y si se creó (201) o ya existía (200)
 * @see RF01, RF02, RF57
 */
export async function crearJugador(
  baseDatos: BaseDatos,
  datosEntrada: DatosCrearJugador,
): Promise<{ estaCreada: boolean; jugador: JugadorDto & { codigoRecuperacion?: string } }> {
  const normalizado = normalizarUsername(datosEntrada.username)
  const hashDelToken = cifrarToken(datosEntrada.token)
  const codigoRecuperacion = generarCodigoRecuperacion()
  const hashRecuperacion = await cifrarCodigoRecuperacion(codigoRecuperacion)
  const fila = await baseDatos.transaccion(async (ejecutorTransaccion) => {
    const jugadorInsertado = await insertarJugador(ejecutorTransaccion, {
      id: datosEntrada.id,
      username: datosEntrada.username,
      normalizado,
      avatar: datosEntrada.avatar,
    })
    if (jugadorInsertado) {
      await asignarHashRecuperacion(ejecutorTransaccion, jugadorInsertado.id, hashRecuperacion)
      if (!(await agregarToken(ejecutorTransaccion, jugadorInsertado.id, hashDelToken))) {
        throw tokenEnUso()
      }
    }
    return jugadorInsertado
  })
  if (fila) {
    return { estaCreada: true, jugador: { ...aJugadorDto(fila), codigoRecuperacion } }
  }

  const mismoNombre = await buscarJugadorPorUsername(baseDatos, normalizado)
  if (datosEntrada.id && mismoNombre?.id === datosEntrada.id) {
    const id = datosEntrada.id
    const estaReclamado = await baseDatos.transaccion(async (ejecutorTransaccion) => {
      // Bloquea la fila para que dos dispositivos no reclamen a la vez el mismo perfil antiguo
      await ejecutorTransaccion.consulta('SELECT id FROM jugadores WHERE id = $1 FOR UPDATE', [id])
      if ((await buscarDuenoToken(ejecutorTransaccion, hashDelToken)) === id) {
        return true
      }
      if ((await contarTokens(ejecutorTransaccion, id)) > 0) {
        return false
      }
      return agregarToken(ejecutorTransaccion, id, hashDelToken)
    })
    if (!estaReclamado) {
      throw new ErrorAplicacion(
        409,
        'profile-claimed',
        'Este perfil ya está protegido. Recupéralo con tu código secreto.',
      )
    }
    return { estaCreada: false, jugador: aJugadorDto(mismoNombre) }
  }
  if (mismoNombre) {
    throw usernameOcupado()
  }
  throw new ErrorAplicacion(409, 'id-taken', 'El identificador ya pertenece a otro jugador.')
}

/**
 * Busca un jugador y lanza un error 404 si no existe.
 * @param baseDatos Conexión con la base de datos o transacción en curso
 * @param id Identificador del jugador
 * @returns Jugador con progreso
 * @see RF57, RF61
 */
export async function requerirJugador(
  baseDatos: BaseDatos,
  id: string,
): Promise<JugadorConProgreso> {
  const jugador = await buscarJugadorPorId(baseDatos, id)
  if (!jugador) {
    throw noEncontrado('No existe un jugador con ese identificador.')
  }
  return jugador
}

/**
 * Perfil completo: progreso, logros y artículos.
 * @param baseDatos Conexión con la base de datos o transacción en curso
 * @param id Identificador del jugador
 * @returns Perfil del jugador
 * @see RF57, RF47, RF48, RF49
 */
export async function obtenerJugador(baseDatos: BaseDatos, id: string) {
  const jugador = await requerirJugador(baseDatos, id)
  return {
    ...aJugadorDto(jugador),
    progreso: {
      xp: jugador.xp,
      nivel: jugador.nivel,
      bits: jugador.bits,
      xpParaSiguienteNivel: xpParaSiguienteNivel(jugador.nivel),
    },
    tieneCodigoRecuperacion: jugador.hash_recuperacion !== null,
    logros: (await listarLogros(baseDatos, id)).map((logro) => ({
      id: logro.logro_id,
      desbloqueadoEn: logro.desbloqueado_en.toISOString(),
    })),
    articulos: await listarArticulos(baseDatos, id),
  }
}

/**
 * Compra un artículo de BitBot con los Bits del servidor (sección 9.4). Es idempotente: comprar de
 * nuevo un artículo que ya tiene no cobra otra vez.
 * @param baseDatos Conexión con la base de datos o transacción en curso
 * @param id Identificador del jugador
 * @param idArticulo Identificador del artículo cosmético
 * @returns Estatus de la compra, artículo y Bits restantes
 * @see RF49
 */
export async function comprarArticulo(baseDatos: BaseDatos, id: string, idArticulo: IdArticulo) {
  await requerirJugador(baseDatos, id)
  const precio = PRECIOS_ARTICULOS[idArticulo]
  const estaComprado = await baseDatos.transaccion(async (ejecutorTransaccion) => {
    if (!(await insertarArticulo(ejecutorTransaccion, id, idArticulo, precio))) {
      return false
    }
    if ((await gastarBits(ejecutorTransaccion, id, precio)) === null) {
      throw new ErrorAplicacion(
        409,
        'insufficient-bits',
        'No tienes Bits suficientes para este artículo.',
      )
    }
    return true
  })
  const jugador = await requerirJugador(baseDatos, id)
  return {
    estatus: estaComprado ? ('created' as const) : ('duplicate' as const),
    idArticulo,
    bits: jugador.bits,
  }
}

/**
 * Convierte una fila de partidas al formato de la API.
 * @param fila Fila con la partida y sus detalles
 * @returns Partida con nombres en camelCase
 * @see RF50, RF57
 */
export const aPartidaDto = (fila: FilaPartida) => ({
  id: fila.id,
  juego: fila.tipo_juego,
  resultado: fila.resultado,
  duracionMs: fila.duracion_ms,
  xpObtenida: fila.xp_obtenida,
  bitsObtenidos: fila.bits_obtenidos,
  resumen: fila.resumen,
  jugadaEn: fila.jugada_en.toISOString(),
  sincronizadaEn: fila.sincronizada_en.toISOString(),
  detalles: fila.detalles,
})

/**
 * Historial paginado del jugador.
 * @param baseDatos Conexión con la base de datos o transacción en curso
 * @param id Identificador del jugador
 * @param limite Cantidad máxima de partidas por página
 * @param desplazamiento Cantidad de partidas que se omiten, desde la más reciente
 * @returns Total, página y partidas
 * @see RF50, RF57
 */
export async function obtenerHistorial(
  baseDatos: BaseDatos,
  id: string,
  limite: number,
  desplazamiento: number,
) {
  await requerirJugador(baseDatos, id)
  const { total, partidas } = await listarPartidas(baseDatos, id, limite, desplazamiento)
  return { total, limite, desplazamiento, partidas: partidas.map(aPartidaDto) }
}

/**
 * Estadísticas acumuladas (sección 10)
 * @param baseDatos Conexión con la base de datos o transacción en curso
 * @param id Identificador del jugador
 * @returns Totales y resultados por juego
 * @see RF51, RF57
 */
export async function obtenerEstadisticas(baseDatos: BaseDatos, id: string) {
  const jugador = await requerirJugador(baseDatos, id)
  const filas = await contarPartidasPorResultado(baseDatos, id)
  const porJuego = Object.fromEntries(
    IDS_JUEGOS.map((juego) => {
      const delJuego = filas.filter((fila) => fila.tipo_juego === juego)
      const suma = (resultados: string[]) =>
        delJuego
          .filter((fila) => resultados.includes(fila.resultado))
          .reduce((suma, fila) => suma + fila.cantidad, 0)
      return [
        juego,
        {
          jugadas: suma(['win', 'loss', 'draw', 'completed']),
          victorias: suma(['win']),
          completadas: suma(['completed']),
        },
      ]
    }),
  )
  const total = (clave: 'jugadas' | 'victorias' | 'completadas') =>
    Object.values(porJuego).reduce((suma, estadistica) => suma + estadistica[clave], 0)

  return {
    partidasJugadas: total('jugadas'),
    victorias: total('victorias'),
    nivelesCompletados: porJuego['ball-sort'].completadas,
    logros: await contarLogros(baseDatos, id),
    xp: jugador.xp,
    nivel: jugador.nivel,
    bits: jugador.bits,
    porJuego,
  }
}
