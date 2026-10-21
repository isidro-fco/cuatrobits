// Tokens de dispositivo. Los genera el cliente (32 bytes al azar en base64url) y el servidor
// guarda solo su huella: con 256 bits de azar basta SHA-256, no hace falta un hash lento.
import { createHash } from 'node:crypto'
import { z } from 'zod'

export const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/, 'El token del dispositivo no es válido.')

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
