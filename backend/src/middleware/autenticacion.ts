/**
 * Archivo: autenticacion.ts
 * Módulo: backend / middleware
 * Descripción: Identifica al jugador por el token de dispositivo y comprueba que solo modifique o
 *              consulte sus propios datos.
 * Requerimientos: RNF12, RLYE02, RF57
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import type { FastifyRequest } from 'fastify'

// ---------- Módulos internos ----------
import type { BaseDatos } from '../config/baseDatos.js'
import { cifrarToken, esquemaToken } from '../models/autenticacion.js'
import { ErrorAplicacion } from '../models/errores.js'
import { buscarDuenoToken } from '../repositories/repositorioTokens.js'

// ---------- Middleware ----------
const noAutorizado = () =>
  new ErrorAplicacion(
    401,
    'unauthorized',
    'Este dispositivo no tiene permiso. Recupera tu perfil con tu código secreto.',
  )

/**
 * Error 403 para un token que pertenece a otro jugador.
 * @returns Error con el código forbidden
 * @see RLYE02
 */
export const prohibido = () =>
  new ErrorAplicacion(403, 'forbidden', 'No puedes modificar los datos de otro jugador.')

/**
 * Devuelve el jugador dueño del token `Authorization: Bearer <token>`; 401 si falta o no es válido
 * @param baseDatos Conexión con la base de datos o transacción en curso
 * @param solicitud Solicitud HTTP recibida
 * @returns Id del jugador dueño del token
 * @see RNF12, RLYE02
 */
export async function autenticar(baseDatos: BaseDatos, solicitud: FastifyRequest): Promise<string> {
  const coincidencia = solicitud.headers.authorization?.match(/^Bearer (.+)$/)
  if (!coincidencia || !esquemaToken.safeParse(coincidencia[1]).success) {
    throw noAutorizado()
  }
  const dueno = await buscarDuenoToken(baseDatos, cifrarToken(coincidencia[1]))
  if (!dueno) {
    throw noAutorizado()
  }
  return dueno
}

/**
 * Exige que el token sea del jugador indicado; 403 si es de otro
 * @param baseDatos Conexión con la base de datos o transacción en curso
 * @param solicitud Solicitud HTTP recibida
 * @param jugadorId Jugador cuyos datos se quieren consultar o modificar
 * @see RLYE02
 */
export async function autorizar(
  baseDatos: BaseDatos,
  solicitud: FastifyRequest,
  jugadorId: string,
): Promise<void> {
  if ((await autenticar(baseDatos, solicitud)) !== jugadorId) {
    throw prohibido()
  }
}
