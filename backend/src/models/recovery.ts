// Códigos secretos para recuperar un perfil (sin correo ni contraseña).
import { randomBytes, randomInt, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>

/** Sin 0/O, 1/I/L ni U/V, que se confunden al copiarlos a mano */
const ALPHABET = 'ABCDEFGHJKMNPQRSTWXYZ23456789'
const LENGTH = 8

/** Código con el formato `ABCD-EFGH` (unos 39 bits de azar) */
export function generateRecoveryCode(): string {
  const chars = Array.from({ length: LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)])
  return `${chars.slice(0, 4).join('')}-${chars.slice(4).join('')}`
}

/** Acepta minúsculas, espacios y guiones al escribirlo */
export function normalizeRecoveryCode(code: string): string {
  return code.toUpperCase().replace(/[\s-]/g, '')
}

export async function hashRecoveryCode(code: string): Promise<string> {
  const salt = randomBytes(16)
  const hash = await scryptAsync(normalizeRecoveryCode(code), salt, 32)
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`
}

export async function verifyRecoveryCode(code: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split('$')
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false
  const expected = Buffer.from(hashHex, 'hex')
  const actual = await scryptAsync(normalizeRecoveryCode(code), Buffer.from(saltHex, 'hex'), expected.length)
  return timingSafeEqual(actual, expected)
}
