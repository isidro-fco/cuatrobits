/**
 * Archivo: autenticacion.ts
 * Módulo: backend / models
 * Descripción: Tokens de dispositivo. Los genera el cliente (32 bytes al azar en base64url) y el
 *              servidor guarda solo su huella: con 256 bits de azar basta SHA-256, no hace falta un
 *              hash lento.
 * Requerimientos: RNF12, RLYE02
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { createHash } from 'node:crypto'
import { z } from 'zod'

// ---------- Funciones ----------
/** Token de dispositivo: 32 bytes en base64url (43 caracteres) */
export const esquemaToken = z
  .string()
  .regex(/^[A-Za-z0-9_-]{43}$/, 'El token del dispositivo no es válido.')

/**
 * Calcula la huella SHA-256 que se guarda en lugar del token.
 * @param token Token secreto del dispositivo
 * @returns Huella en hexadecimal
 * @see RNF12
 */
export function cifrarToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
