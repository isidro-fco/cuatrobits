/**
 * Archivo: ControladorPartida.ts
 * Módulo: backend / controllers
 * Descripción: Controlador de las rutas /api/games: identifica al jugador por su token y llama al
 *              servicio de partidas (clase ControladorPartida del diagrama de clases).
 * Requerimientos: RF56, RF58, RF62, RLYE02
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-11-09
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import type { FastifyReply, FastifyRequest } from 'fastify'

// ---------- Módulos internos ----------
import type { BaseDatos } from '../config/baseDatos.js'
import { autenticar } from '../middleware/autenticacion.js'
import { esquemaSincronizacion } from '../models/esquemas.js'
import { analizar } from '../models/validacion.js'
import { guardarPartida, sincronizarPartidas } from '../services/servicioPartidas.js'

// ---------- Controlador de partidas ----------
/**
 * Atiende las solicitudes de /api/games. Solo el jugador autenticado puede guardar sus partidas:
 * 401 sin token y 403 si la partida es de otro jugador.
 * @see RF58, RLYE02
 */
export class ControladorPartida {
  /**
   * @param baseDatos Conexión con la base de datos
   * @see RF58
   */
  constructor(private readonly baseDatos: BaseDatos) {}

  /**
   * POST /api/games: guarda una partida terminada.
   * @param solicitud Solicitud con la partida en el cuerpo
   * @param respuesta Respuesta: 201 si se guardó, 200 si ya estaba registrada
   * @returns Respuesta con el id de la partida y su estatus
   * @see RF58, RF60, RF62
   */
  async guardar(solicitud: FastifyRequest, respuesta: FastifyReply) {
    const resultado = await guardarPartida(
      this.baseDatos,
      solicitud.body,
      await autenticar(this.baseDatos, solicitud),
    )
    return respuesta.status(resultado.estatus === 'created' ? 201 : 200).send(resultado)
  }

  /**
   * POST /api/games/sync: confirma qué partidas pendientes quedaron almacenadas (sección 13.4).
   * @param solicitud Solicitud con `{ partidas }` en el cuerpo
   * @returns Resultado de cada partida del lote
   * @see RF55, RF58, RF62
   */
  async sincronizar(solicitud: FastifyRequest) {
    const idDueno = await autenticar(this.baseDatos, solicitud)
    const { partidas } = analizar(esquemaSincronizacion, solicitud.body)
    return { resultados: await sincronizarPartidas(this.baseDatos, partidas, idDueno) }
  }
}
