import type { FastifyRequest } from 'fastify'
import type { Database } from '../config/database.js'
import { hashToken, tokenSchema } from '../models/auth.js'
import { AppError } from '../models/errors.js'
import { findTokenOwner } from '../repositories/tokenRepository.js'

const unauthorized = () =>
  new AppError(401, 'unauthorized', 'Este dispositivo no tiene permiso. Recupera tu perfil con tu código secreto.')

export const forbidden = () => new AppError(403, 'forbidden', 'No puedes modificar los datos de otro jugador.')

/** Devuelve el jugador dueño del token `Authorization: Bearer <token>`; 401 si falta o no es válido */
export async function authenticate(db: Database, request: FastifyRequest): Promise<string> {
  const match = request.headers.authorization?.match(/^Bearer (.+)$/)
  if (!match || !tokenSchema.safeParse(match[1]).success) throw unauthorized()
  const owner = await findTokenOwner(db, hashToken(match[1]))
  if (!owner) throw unauthorized()
  return owner
}

/** Exige que el token sea del jugador indicado; 403 si es de otro */
export async function authorize(db: Database, request: FastifyRequest, playerId: string): Promise<void> {
  if ((await authenticate(db, request)) !== playerId) throw forbidden()
}
