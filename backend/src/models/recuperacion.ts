/**
 * Archivo: recuperacion.ts
 * Módulo: backend / models
 * Descripción: Códigos secretos para recuperar un perfil en otro dispositivo, sin correo ni
 *              contraseña.
 * Requerimientos: RNF12, RLYE01
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { randomBytes, randomInt, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

// ---------- Constantes ----------
/** Sin 0/O, 1/I/L ni U/V, que se confunden al copiarlos a mano */
const ALFABETO = 'ABCDEFGHJKMNPQRSTWXYZ23456789'
/** Caracteres del código secreto, sin contar el guion */
const LONGITUD = 8

// ---------- Funciones ----------
const scryptAsincrono = promisify(scrypt) as (
  contrasena: string,
  sal: Buffer,
  longitudClave: number,
) => Promise<Buffer>

/**
 * Código con el formato `ABCD-EFGH` (unos 39 bits de azar)
 * @returns Código nuevo
 * @see RNF12
 */
export function generarCodigoRecuperacion(): string {
  const caracteres = Array.from({ length: LONGITUD }, () => ALFABETO[randomInt(ALFABETO.length)])
  return `${caracteres.slice(0, 4).join('')}-${caracteres.slice(4).join('')}`
}

/**
 * Acepta minúsculas, espacios y guiones al escribirlo
 * @param codigo Código secreto de recuperación
 * @returns Código en mayúsculas sin espacios ni guiones
 * @see RNF12
 */
export function normalizarCodigoRecuperacion(codigo: string): string {
  return codigo.toUpperCase().replace(/[\s-]/g, '')
}

/**
 * Calcula la huella scrypt del código; nunca se guarda el código.
 * @param codigo Código secreto de recuperación
 * @returns Sal y huella en un solo texto
 * @see RNF12
 */
export async function cifrarCodigoRecuperacion(codigo: string): Promise<string> {
  const sal = randomBytes(16)
  const hash = await scryptAsincrono(normalizarCodigoRecuperacion(codigo), sal, 32)
  return `scrypt$${sal.toString('hex')}$${hash.toString('hex')}`
}

/**
 * Compara un código con la huella guardada en tiempo constante.
 * @param codigo Código secreto de recuperación
 * @param guardado Sal y huella guardadas
 * @returns true si el código corresponde
 * @see RNF12
 */
export async function verificarCodigoRecuperacion(
  codigo: string,
  guardado: string,
): Promise<boolean> {
  const [esquemaColor, salHexadecimal, hashHexadecimal] = guardado.split('$')
  if (esquemaColor !== 'scrypt' || !salHexadecimal || !hashHexadecimal) {
    return false
  }
  const esperado = Buffer.from(hashHexadecimal, 'hex')
  const valorObtenido = await scryptAsincrono(
    normalizarCodigoRecuperacion(codigo),
    Buffer.from(salHexadecimal, 'hex'),
    esperado.length,
  )
  return timingSafeEqual(valorObtenido, esperado)
}
