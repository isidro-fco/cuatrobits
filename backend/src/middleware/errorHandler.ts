import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { AppError } from '../models/errors.js'

/** Respuestas de error uniformes: `{ error, message, details? }` */
export function errorHandler(err: FastifyError | AppError, request: FastifyRequest, reply: FastifyReply) {
  if (err instanceof AppError) {
    return reply.status(err.statusCode).send({ error: err.code, message: err.message, details: err.details })
  }
  // Errores de Fastify, como un JSON mal formado
  if (err.statusCode && err.statusCode < 500) {
    return reply.status(err.statusCode).send({ error: 'bad-request', message: err.message })
  }
  request.log.error(err)
  return reply.status(500).send({ error: 'internal-error', message: 'Ocurrió un error en el servidor.' })
}
