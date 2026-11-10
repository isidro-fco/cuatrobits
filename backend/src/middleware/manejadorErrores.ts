/**
 * Archivo: manejadorErrores.ts
 * Módulo: backend / middleware
 * Descripción: Convierte cualquier error en una respuesta JSON uniforme `{ error, mensaje,
 *              detalles? }`.
 * Requerimientos: RF61
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'

// ---------- Módulos internos ----------
import { ErrorAplicacion } from '../models/errores.js'

// ---------- Middleware ----------
/**
 * Convierte cualquier error en una respuesta uniforme `{ error, mensaje, detalles? }`.
 * @param errorCapturado Error lanzado al atender la solicitud
 * @param solicitud Solicitud HTTP recibida
 * @param respuesta Respuesta HTTP que se enviará
 * @returns Respuesta con el código HTTP del error
 * @see RF61
 */
export function manejadorErrores(
  errorCapturado: FastifyError | ErrorAplicacion,
  solicitud: FastifyRequest,
  respuesta: FastifyReply,
) {
  if (errorCapturado instanceof ErrorAplicacion) {
    return respuesta.status(errorCapturado.statusCode).send({
      error: errorCapturado.codigo,
      mensaje: errorCapturado.message,
      detalles: errorCapturado.detalles,
    })
  }
  // Errores de Fastify, como un JSON mal formado
  if (errorCapturado.statusCode && errorCapturado.statusCode < 500) {
    return respuesta
      .status(errorCapturado.statusCode)
      .send({ error: 'bad-request', mensaje: errorCapturado.message })
  }
  solicitud.log.error(errorCapturado)
  return respuesta
    .status(500)
    .send({ error: 'internal-error', mensaje: 'Ocurrió un error en el servidor.' })
}
