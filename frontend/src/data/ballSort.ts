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

// Cada color lleva un símbolo para no depender solo de la percepción del color (sección 12.3)
export const SPHERE_SYMBOLS = ['●', '★', '▲', '■', '◆', '♥', '✚', '♣', '☾', '✖']

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
