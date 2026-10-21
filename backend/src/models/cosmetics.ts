// Precios de los artículos de BitBot en Bits (sección 9.4). Solo cambian su apariencia.
// Deben coincidir con frontend/src/data/cosmetics.ts; una prueba lo comprueba.

export const ITEM_PRICES = {
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

export type ItemId = keyof typeof ITEM_PRICES

export const ITEM_IDS = Object.keys(ITEM_PRICES) as [ItemId, ...ItemId[]]
