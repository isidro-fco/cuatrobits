/**
 * Archivo: esferas.ts
 * Módulo: frontend / data
 * Descripción: Colores, sombras, símbolos y nombres de las esferas.
 * Requerimientos: RF31, RNF03
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import type { NombreGlifo } from './glifosPixel'

// ---------- Constantes ----------
/** Color de relleno de cada esfera, por índice */
export const COLORES_ESFERAS = [
  '#1a6be8', // azul
  '#ffd35c', // amarillo
  '#ef5b5b', // rojo
  '#58d9ae', // menta
  '#9b7cf0', // lila
  '#ff8c42', // naranja
  '#45c6db', // cian
  '#f07cb2', // rosa
  '#14295c', // azul marino
  '#9ed74a', // verde lima
]

/** Tono de sombra de cada color, para el relieve de las esferas de pixel art */
export const SOMBRAS_ESFERAS = [
  '#1152bb',
  '#e0a800',
  '#b83a3a',
  '#1fa57a',
  '#6d4fd6',
  '#d9661f',
  '#1f95aa',
  '#c4508a',
  '#0a1736',
  '#6fa825',
]

// Cada color lleva un símbolo para no depender solo de la percepción del color (sección 12.3)
export const SIMBOLOS_ESFERAS: NombreGlifo[] = [
  'circle',
  'star',
  'triangle',
  'square',
  'diamond',
  'heart',
  'cross',
  'club',
  'moon',
  'x',
]

/** Nombre de cada color, para los lectores de pantalla (RNF03) */
export const NOMBRES_ESFERAS = [
  'azul',
  'amarilla',
  'roja',
  'menta',
  'lila',
  'naranja',
  'cian',
  'rosa',
  'azul marino',
  'verde lima',
]

/** Cantidad mínima de colores de un nivel (RF31) */
export const MIN_COLORES = 1
/** Cantidad máxima de colores de un nivel (RF31) */
export const MAX_COLORES = 10
/** Esferas de cada color; también es la capacidad de un tubo (RF32) */
export const ESFERAS_POR_COLOR = 5

// ---------- Funciones ----------
/**
 * Número de tubos según la especificación (sección 7.2): T(c) = max(5, c + 2)
 * @param colores Cantidad de colores del nivel (1 a 10)
 * @returns Cantidad de tubos del nivel
 * @see RF32
 */
export function calcularTubos(colores: number): number {
  return Math.max(5, colores + 2)
}
