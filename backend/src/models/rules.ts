// Reglas de recompensas y niveles (secciones 9.1 y 9.2).
// Deben coincidir con frontend/src/utils/rewards.ts y frontend/src/utils/progression.ts;
// una prueba lo comprueba.

export const GAME_IDS = ['connect-four', 'bitbot', 'ball-sort', 'memory'] as const
export type GameId = (typeof GAME_IDS)[number]

export const GAME_RESULTS = ['win', 'loss', 'draw', 'completed'] as const
export type GameResult = (typeof GAME_RESULTS)[number]

/** Resultados posibles en cada juego */
export const RESULTS_BY_GAME: Record<GameId, readonly GameResult[]> = {
  'connect-four': ['win', 'loss', 'draw'],
  bitbot: ['win', 'loss'],
  'ball-sort': ['completed'],
  memory: ['completed'],
}

export const XP_COMPLETE = 10

export const XP_BONUS: Record<GameId, number> = {
  'connect-four': 15,
  bitbot: 10,
  'ball-sort': 15,
  memory: 10,
}

export function xpForGame(game: GameId, result: GameResult): number {
  const success = result === 'win' || result === 'completed'
  return XP_COMPLETE + (success ? XP_BONUS[game] : 0)
}

/** Bits por terminar una partida y bono por ganarla o completarla (sección 9.4) */
export const BITS_COMPLETE = 2
export const BITS_SUCCESS = 3

export function bitsForGame(result: GameResult): number {
  const success = result === 'win' || result === 'completed'
  return BITS_COMPLETE + (success ? BITS_SUCCESS : 0)
}

export function xpForNextLevel(level: number): number {
  return 100 + (level - 1) * 50
}

export function levelFromXp(totalXp: number): number {
  let level = 1
  let remaining = Math.max(0, Math.floor(totalXp))
  while (remaining >= xpForNextLevel(level)) {
    remaining -= xpForNextLevel(level)
    level++
  }
  return level
}
