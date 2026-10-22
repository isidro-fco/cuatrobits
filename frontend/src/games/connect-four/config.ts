import type { AiDifficulty } from './ai'
import type { GlyphName } from '../../data/pixelGlyphs'

export type ConnectFourConfig = { mode: 'ai'; difficulty: AiDifficulty } | { mode: 'local' }

export const AI_DIFFICULTY_NAMES: Record<AiDifficulty, string> = {
  easy: 'Fácil',
  normal: 'Normal',
  hard: 'Difícil',
}

function isAiDifficulty(value: string | null): value is AiDifficulty {
  return value !== null && value in AI_DIFFICULTY_NAMES
}

/** Lee la configuración de la URL; `null` si falta o no es válida */
export function parseConnectFourConfig(params: URLSearchParams): ConnectFourConfig | null {
  const mode = params.get('modo')
  if (mode === 'local') return { mode: 'local' }
  const difficulty = params.get('dificultad')
  if (mode === 'ia' && isAiDifficulty(difficulty)) return { mode: 'ai', difficulty }
  return null
}

export function connectFourPath(config: ConnectFourConfig): string {
  return config.mode === 'local'
    ? '/juego/connect-four?modo=local'
    : `/juego/connect-four?modo=ia&dificultad=${config.difficulty}`
}

// Paleta de fichas (sección 5.3). Colores intensos que resaltan sobre los huecos claros del tablero;
// cada ficha lleva además un símbolo para no depender solo del color.
export interface DiscStyle {
  name: string
  color: string
  /** Color del símbolo, elegido para que contraste con la ficha */
  ink: string
}

const DARK_INK = '#14295c'
const LIGHT_INK = '#ffffff'

export const DISC_PALETTE: DiscStyle[] = [
  { name: 'roja', color: '#e63946', ink: LIGHT_INK },
  { name: 'amarilla', color: '#ffc61a', ink: DARK_INK },
  { name: 'verde', color: '#16a34a', ink: LIGHT_INK },
  { name: 'naranja', color: '#f97316', ink: DARK_INK },
  { name: 'rosa', color: '#e83e8c', ink: LIGHT_INK },
  { name: 'morada', color: '#7c3aed', ink: LIGHT_INK },
]

/** Parejas que se parecen demasiado, sobre todo con daltonismo; nunca se asignan juntas */
const SIMILAR_PAIRS = [
  ['roja', 'rosa'],
  ['roja', 'naranja'],
  ['rosa', 'morada'],
]

export const areSimilar = (a: DiscStyle, b: DiscStyle) =>
  SIMILAR_PAIRS.some(([x, y]) => (a.name === x && b.name === y) || (a.name === y && b.name === x))

export const DISC_SYMBOLS = ['star', 'circle'] as const satisfies readonly GlyphName[]

/** Elige dos colores distintos al azar que se distingan bien entre sí */
export function pickDiscColors(random: () => number = Math.random): [DiscStyle, DiscStyle] {
  const first = DISC_PALETTE[Math.floor(random() * DISC_PALETTE.length)]
  const options = DISC_PALETTE.filter((d) => d !== first && !areSimilar(first, d))
  return [first, options[Math.floor(random() * options.length)]]
}
