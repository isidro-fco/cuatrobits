/**
 * Archivo: trazosPixel.ts
 * Módulo: frontend / utils
 * Descripción: Convierte un sprite de pixel art en trazos SVG, uno por color.
 * Requerimientos: RNF08, RE03
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-22
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Tipos ----------
/** Trazo SVG de todos los píxeles de un mismo color (letra de la fila) */
export interface TrazoPixel {
  caracter: string
  d: string
}

// ---------- Funciones ----------
/** Trazos ya calculados de cada sprite, para no recalcularlos en cada dibujo */
const memoria = new WeakMap<readonly string[], TrazoPixel[]>()

/**
 * Convierte las filas de un sprite en un trazo por color. Los píxeles seguidos de cada fila se unen
 * en un solo rectángulo, así un sprite queda en unos pocos elementos en lugar de cientos.
 * @param filas Filas del sprite, una letra de la paleta por píxel
 * @returns Un trazo SVG por color
 * @see RNF08, RE03
 */
export function trazosPixel(filas: readonly string[]): TrazoPixel[] {
  const enCache = memoria.get(filas)
  if (enCache) {
    return enCache
  }
  const porCaracter = new Map<string, string[]>()
  filas.forEach((fila, numeroFila) => {
    let numeroColumna = 0
    while (numeroColumna < fila.length) {
      const caracter = fila[numeroColumna]
      let fin = numeroColumna + 1
      while (fin < fila.length && fila[fin] === caracter) {
        fin++
      }
      if (caracter !== '.') {
        const partes = porCaracter.get(caracter) ?? []
        partes.push(
          `M${numeroColumna} ${numeroFila}h${fin - numeroColumna}v1h${numeroColumna - fin}z`,
        )
        porCaracter.set(caracter, partes)
      }
      numeroColumna = fin
    }
  })
  const rutas = [...porCaracter].map(([caracter, partes]) => ({ caracter, d: partes.join('') }))
  memoria.set(filas, rutas)
  return rutas
}
