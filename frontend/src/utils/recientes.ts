/**
 * Archivo: recientes.ts
 * Módulo: frontend / utils
 * Descripción: Recuerda qué palabras e imágenes salieron en las últimas partidas para no repetirlas
 *              tan seguido.
 * Requerimientos: RF23, RF41
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Constantes ----------
// Recuerda qué palabras e imágenes salieron en las últimas partidas para no repetirlas tan seguido.
// Es una comodidad: si el navegador no deja guardar, los juegos siguen funcionando sin ella.
const CLAVE_ALMACENAMIENTO = 'cuatrobits-recent'

// ---------- Funciones ----------
function cargar(): Record<string, string[]> {
  try {
    const datos: unknown = JSON.parse(localStorage.getItem(CLAVE_ALMACENAMIENTO) ?? '{}')
    return datos && typeof datos === 'object' ? (datos as Record<string, string[]>) : {}
  } catch {
    return {}
  }
}

/**
 * Elementos usados recientemente en `lista` (por ejemplo `bitbot:animals`), del más nuevo al más
 * viejo
 * @param lista Nombre de la lista, por ejemplo bitbot:animals
 * @returns Elementos recientes; vacío si no se pudo leer
 * @see RF23, RF41
 */
export function obtenerRecientes(lista: string): string[] {
  const articulos = cargar()[lista]
  return Array.isArray(articulos)
    ? articulos.filter((articulo) => typeof articulo === 'string')
    : []
}

/**
 * Agrega `usadas` al principio de la lista y conserva solo los `conservar` más nuevos
 * @param lista Nombre de la lista
 * @param usadas Elementos de la partida actual
 * @param conservar Cantidad máxima que se guarda
 * @see RF23, RF41
 */
export function recordarRecientes(lista: string, usadas: string[], conservar: number): void {
  const datos = cargar()
  datos[lista] = [...new Set([...usadas, ...obtenerRecientes(lista)])].slice(
    0,
    Math.max(0, conservar),
  )
  try {
    localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(datos))
  } catch {
    // Sin almacenamiento solo se pierde la variedad entre partidas
  }
}
