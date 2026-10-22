import type { GlyphName } from './pixelGlyphs'

export const SPHERE_COLORS = [
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
export const SPHERE_SHADES = [
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
export const SPHERE_SYMBOLS: GlyphName[] = ['circle', 'star', 'triangle', 'square', 'diamond', 'heart', 'cross', 'club', 'moon', 'x']

export const SPHERE_NAMES = [
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

export const MIN_COLORS = 1
export const MAX_COLORS = 10
export const SPHERES_PER_COLOR = 5

/** Número de tubos según la especificación (sección 7.2): T(c) = max(5, c + 2) */
export function tubeCount(colors: number): number {
  return Math.max(5, colors + 2)
}
