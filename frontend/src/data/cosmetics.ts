// Artículos de BitBot que se compran con Bits (sección 9.4). Solo cambian su apariencia.
// Los precios deben coincidir con backend/src/models/cosmetics.ts; una prueba lo comprueba.
import { BITBOT_SPRITE, type SpriteDefinition } from './sprites'

export type CosmeticKind = 'color' | 'accessory'

export interface CosmeticItem {
  id: string
  kind: CosmeticKind
  name: string
  price: number
  /** Color del cuerpo de BitBot */
  color?: string
  /** Filas que reemplazan las del sprite (mitad izquierda); `.` conserva el píxel original */
  overlay?: Record<number, string>
  palette?: Record<string, string>
}

export const COSMETICS: CosmeticItem[] = [
  { id: 'color-blue', kind: 'color', name: 'Azul clásico', price: 0, color: '#1a6be8' },
  { id: 'color-mint', kind: 'color', name: 'Verde menta', price: 30, color: '#2bb59a' },
  { id: 'color-orange', kind: 'color', name: 'Naranja', price: 40, color: '#ff8c42' },
  { id: 'color-lilac', kind: 'color', name: 'Lila', price: 50, color: '#9b6bdf' },
  { id: 'color-red', kind: 'color', name: 'Rojo', price: 60, color: '#e5484d' },
  { id: 'color-gold', kind: 'color', name: 'Dorado', price: 120, color: '#d9a21b' },
  { id: 'accessory-none', kind: 'accessory', name: 'Sin accesorio', price: 0 },
  {
    id: 'accessory-bow',
    kind: 'accessory',
    name: 'Moño',
    price: 30,
    overlay: { 10: '...ppq' },
    palette: { p: '#f07cb2', q: '#c2457f' },
  },
  {
    id: 'accessory-cap',
    kind: 'accessory',
    name: 'Gorro',
    price: 40,
    overlay: { 0: '...rrr', 1: '..rrrr', 2: 'RRRRRR' },
    palette: { r: '#e5484d', R: '#14295c' },
  },
  {
    id: 'accessory-glasses',
    kind: 'accessory',
    name: 'Lentes de sol',
    price: 50,
    overlay: { 4: '..kckk', 5: '..kkkw' },
    palette: { k: '#14295c', c: '#8fd3ff', w: '#ffffff' },
  },
  {
    id: 'accessory-headphones',
    kind: 'accessory',
    name: 'Audífonos',
    price: 60,
    overlay: { 1: '.kkkkk', 2: 'k.....', 3: 'k.....', 4: 'h.....', 5: 'h.....', 6: 'h.....' },
    palette: { k: '#14295c', h: '#ff8c42' },
  },
  {
    id: 'accessory-crown',
    kind: 'accessory',
    name: 'Corona',
    price: 100,
    overlay: { 0: '.y.y.y', 1: '.yyyyg' },
    palette: { y: '#ffc21a', g: '#e5484d' },
  },
]

export const DEFAULT_BITBOT = { color: 'color-blue', accessory: 'accessory-none' }

/** Artículos gratuitos que todos los jugadores tienen desde el inicio */
export const FREE_ITEMS = COSMETICS.filter((item) => item.price === 0).map((item) => item.id)

export function findCosmetic(id: string): CosmeticItem | undefined {
  return COSMETICS.find((item) => item.id === id)
}

export function bitbotBodyColor(colorId: string): string {
  return findCosmetic(colorId)?.color ?? BITBOT_SPRITE.palette.b
}

/** Sprite de BitBot con el color y el accesorio elegidos */
export function bitbotSprite(look: { color: string; accessory: string }): SpriteDefinition {
  const accessory = findCosmetic(look.accessory)
  const half = BITBOT_SPRITE.half.map((row, y) => {
    const overlay = accessory?.overlay?.[y]
    if (!overlay) return row
    return [...row].map((char, x) => (overlay[x] === '.' ? char : overlay[x])).join('')
  })
  return {
    half,
    palette: { ...BITBOT_SPRITE.palette, b: bitbotBodyColor(look.color), ...accessory?.palette },
  }
}
