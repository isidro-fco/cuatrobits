import type { AiDifficulty } from './ai'

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

// Paleta de fichas (sección 5.3). Cada color lleva un símbolo para no depender solo del color.
export interface DiscStyle {
  name: string
  color: string
}

export const DISC_PALETTE: DiscStyle[] = [
  { name: 'roja', color: '#ef5b5b' },
  { name: 'amarilla', color: '#ffd35c' },
  { name: 'verde', color: '#58d9ae' },
  { name: 'lila', color: '#c4b0ff' },
  { name: 'blanca', color: '#ffffff' },
]

export const DISC_SYMBOLS = ['★', '●'] as const

/** Elige dos colores distintos al azar */
export function pickDiscColors(random: () => number = Math.random): [DiscStyle, DiscStyle] {
  const first = Math.floor(random() * DISC_PALETTE.length)
  let second = Math.floor(random() * (DISC_PALETTE.length - 1))
  if (second >= first) second++
  return [DISC_PALETTE[first], DISC_PALETTE[second]]
}
