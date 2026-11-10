/**
 * Archivo: token.ts
 * Módulo: frontend / utils
 * Descripción: Genera el token secreto del dispositivo (sección 4.3): 32 bytes al azar en
 *              base64url.
 * Requerimientos: RNF12, RLYE02
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Funciones ----------
/**
 * Genera el token secreto del dispositivo: 32 bytes al azar en base64url.
 * @returns Token nuevo
 * @see RNF12, RLYE02
 */
export function generarToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}
