/**
 * Archivo: ControladorJugador.ts
 * Módulo: backend / controllers
 * Descripción: Controlador de las rutas /api/players: valida la solicitud, comprueba que el token
 *              sea del jugador y llama al servicio que corresponde (clase ControladorJugador del
 *              diagrama de clases).
 * Requerimientos: RF01, RF02, RF49, RF57, RF61, RLYE02
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-11-09
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

// ---------- Módulos internos ----------
import type { BaseDatos } from '../config/baseDatos.js'
import { autorizar } from '../middleware/autenticacion.js'
import {
  esquemaComprarArticulo,
  esquemaConsultaHistorial,
  esquemaCrearJugador,
  esquemaId,
  esquemaRecuperacion,
} from '../models/esquemas.js'
import { analizar } from '../models/validacion.js'
import {
  comprarArticulo,
  crearJugador,
  obtenerEstadisticas,
  obtenerHistorial,
  obtenerJugador,
} from '../services/servicioJugadores.js'
import {
  LimitadorIntentos,
  crearCodigoRecuperacion,
  recuperarJugador,
} from '../services/servicioRecuperacion.js'

// ---------- Constantes ----------
/** Parámetros de las rutas /api/players/:id */
const esquemaParametros = z.object({ id: esquemaId })

// ---------- Controlador de jugadores ----------
/**
 * Atiende las solicitudes de /api/players. Las rutas con `:id` exigen el token del jugador:
 * 401 sin token válido y 403 si el token es de otro jugador.
 * @see RF57, RLYE02
 */
export class ControladorJugador {
  /**
   * @param baseDatos Conexión con la base de datos
   * @param limitador Limitador de intentos fallidos de recuperación
   * @see RF57
   */
  constructor(
    private readonly baseDatos: BaseDatos,
    private readonly limitador = new LimitadorIntentos(),
  ) {}

  /**
   * POST /api/players: registra un jugador y el token de su dispositivo.
   * @param solicitud Solicitud con `{ id?, username, avatar, token }`
   * @param respuesta Respuesta: 201 si se creó, 200 si es un reintento del mismo dispositivo
   * @returns Respuesta con el jugador y, solo al crearlo, su código de recuperación
   * @see RF01, RF02, RF57
   */
  async crear(solicitud: FastifyRequest, respuesta: FastifyReply) {
    const { estaCreada, jugador } = await crearJugador(
      this.baseDatos,
      analizar(esquemaCrearJugador, solicitud.body),
    )
    return respuesta.status(estaCreada ? 201 : 200).send(jugador)
  }

  /**
   * POST /api/players/recover: recupera un perfil con su nombre y código secreto.
   * 401 si los datos no coinciden y 429 tras demasiados intentos.
   * @param solicitud Solicitud con `{ username, codigo, token }`
   * @returns Perfil completo con su historial
   * @see RNF12, RF61
   */
  async recuperar(solicitud: FastifyRequest) {
    return recuperarJugador(
      this.baseDatos,
      this.limitador,
      analizar(esquemaRecuperacion, solicitud.body),
    )
  }

  /**
   * POST /api/players/:id/recovery-code: crea el código de un perfil anterior a la recuperación.
   * 409 si ya tiene uno.
   * @param solicitud Solicitud con el id del jugador en la ruta
   * @param respuesta Respuesta con estatus 201
   * @returns Respuesta con el código nuevo
   * @see RNF12
   */
  async crearCodigo(solicitud: FastifyRequest, respuesta: FastifyReply) {
    const id = await this.idAutorizado(solicitud)
    return respuesta
      .status(201)
      .send({ codigoRecuperacion: await crearCodigoRecuperacion(this.baseDatos, id) })
  }

  /**
   * GET /api/players/:id: perfil con experiencia, nivel, Bits, logros y artículos.
   * @param solicitud Solicitud con el id del jugador en la ruta
   * @returns Perfil del jugador
   * @see RF57, RF06
   */
  async obtener(solicitud: FastifyRequest) {
    return obtenerJugador(this.baseDatos, await this.idAutorizado(solicitud))
  }

  /**
   * GET /api/players/:id/history: historial paginado con los detalles de cada partida.
   * @param solicitud Solicitud con el id en la ruta y `limite` y `desplazamiento` en la consulta
   * @returns Total, página y partidas
   * @see RF50, RF57
   */
  async obtenerHistorial(solicitud: FastifyRequest) {
    const id = await this.idAutorizado(solicitud)
    const { limite, desplazamiento } = analizar(esquemaConsultaHistorial, solicitud.query)
    return obtenerHistorial(this.baseDatos, id, limite, desplazamiento)
  }

  /**
   * GET /api/players/:id/stats: totales y resultados por juego.
   * @param solicitud Solicitud con el id del jugador en la ruta
   * @returns Estadísticas acumuladas
   * @see RF51, RF57
   */
  async obtenerEstadisticas(solicitud: FastifyRequest) {
    return obtenerEstadisticas(this.baseDatos, await this.idAutorizado(solicitud))
  }

  /**
   * POST /api/players/:id/items: compra un artículo de BitBot.
   * 201 comprado, 200 si ya lo tenía y 409 sin Bits suficientes.
   * @param solicitud Solicitud con el id en la ruta y `{ idArticulo }` en el cuerpo
   * @param respuesta Respuesta con el estatus de la compra
   * @returns Respuesta con el artículo y los Bits restantes
   * @see RF49
   */
  async comprarArticulo(solicitud: FastifyRequest, respuesta: FastifyReply) {
    const id = await this.idAutorizado(solicitud)
    const { idArticulo } = analizar(esquemaComprarArticulo, solicitud.body)
    const resultado = await comprarArticulo(this.baseDatos, id, idArticulo)
    return respuesta.status(resultado.estatus === 'created' ? 201 : 200).send(resultado)
  }

  /**
   * Valida el id de la ruta y exige que el token de la solicitud sea de ese jugador.
   * @param solicitud Solicitud con el id del jugador en la ruta
   * @returns Id del jugador autorizado
   * @see RLYE02
   */
  private async idAutorizado(solicitud: FastifyRequest): Promise<string> {
    const { id } = analizar(esquemaParametros, solicitud.params)
    await autorizar(this.baseDatos, solicitud, id)
    return id
  }
}
