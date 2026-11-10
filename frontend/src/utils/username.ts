/**
 * Archivo: username.ts
 * Módulo: frontend / utils
 * Descripción: Normalización y validación del nombre de usuario (sección 4.1).
 * Requerimientos: RF01, RF02
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Constantes ----------
// ---------- Constantes ----------
export const LONGITUD_MINIMA_USERNAME = 3
/** Longitud máxima del nombre de usuario */
export const LONGITUD_MAXIMA_USERNAME = 15

/** Letras (con tildes y ñ), números y guion bajo */
const PATRON_USERNAME = /^[\p{L}\p{N}_]+$/u

// ---------- Funciones ----------
// ---------- Funciones ----------
/**
 * Forma usada para comparar nombres sin distinguir mayúsculas (sección 4.1)
 * @param username Nombre de usuario
 * @returns Nombre sin espacios al inicio o al final y en minúsculas
 * @see RF02
 */
export function normalizarUsername(username: string): string {
  return username.trim().normalize('NFC').toLocaleLowerCase('es')
}

/**
 * Valida longitud y caracteres permitidos del nombre de usuario.
 * @param username Nombre de usuario
 * @returns Mensaje de error o null si el nombre es válido
 * @see RF01, RF02
 */
export function validarUsername(username: string): string | null {
  const nombre = username.trim()
  if (nombre.length < LONGITUD_MINIMA_USERNAME) {
    return `Tu nombre debe tener al menos ${LONGITUD_MINIMA_USERNAME} letras.`
  }
  if (nombre.length > LONGITUD_MAXIMA_USERNAME) {
    return `Tu nombre puede tener hasta ${LONGITUD_MAXIMA_USERNAME} letras.`
  }
  if (!PATRON_USERNAME.test(nombre)) {
    return 'Usa solo letras, números o guion bajo (_).'
  }
  return null
}
