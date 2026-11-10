/**
 * Archivo: cosmeticos.ts
 * Módulo: backend / models
 * Descripción: Precios de los artículos de BitBot en Bits (sección 9.4). Deben coincidir con
 *              frontend/src/data/cosmeticos.ts; una prueba lo comprueba.
 * Requerimientos: RF49, RNF13
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Tipos ----------
export type IdArticulo = keyof typeof PRECIOS_ARTICULOS

// ---------- Constantes ----------
/** Precio en Bits de cada artículo; los gratuitos cuestan 0 */
export const PRECIOS_ARTICULOS = {
  'color-blue': 0,
  'color-mint': 30,
  'color-orange': 40,
  'color-lilac': 50,
  'color-red': 60,
  'color-gold': 120,
  'accessory-none': 0,
  'accessory-bow': 30,
  'accessory-cap': 40,
  'accessory-glasses': 50,
  'accessory-headphones': 60,
  'accessory-crown': 100,
} as const satisfies Record<string, number>

/** Ids de los artículos que se pueden comprar, para validar las compras */
export const IDS_ARTICULOS = Object.keys(PRECIOS_ARTICULOS) as [IdArticulo, ...IdArticulo[]]
