// Condiciones de los logros (sección 9.3).
// Deben coincidir con backend/src/models/achievements.ts; una prueba lo comprueba.
import { GAME_ORDER } from '../data/games'
import type { GameId, GameRecord } from '../types'

/** Totales del jugador a partir de sus partidas */
export interface AchievementSummary {
  gamesPlayed: number
  /** Victorias en Conecta 4 y BitBot, niveles o tableros completados en esferas y Memorama */
  successesByGame: Record<GameId, number>
  /** Parejas encontradas en todas las partidas de Memorama */
  memoryPairs: number
}

const successes = (s: AchievementSummary) => GAME_ORDER.reduce((n, game) => n + s.successesByGame[game], 0)

/** Mismo orden que data/achievements.ts */
export const ACHIEVEMENT_RULES: { id: string; unlocked: (s: AchievementSummary) => boolean }[] = [
  { id: 'first-game', unlocked: (s) => s.gamesPlayed >= 1 },
  { id: 'first-win', unlocked: (s) => successes(s) >= 1 },
  { id: 'five-games', unlocked: (s) => s.gamesPlayed >= 5 },
  { id: 'win-each-game', unlocked: (s) => GAME_ORDER.every((game) => s.successesByGame[game] >= 1) },
  { id: 'bitbot-10', unlocked: (s) => s.successesByGame.bitbot >= 10 },
  { id: 'ball-sort-5', unlocked: (s) => s.successesByGame['ball-sort'] >= 5 },
  { id: 'memory-10', unlocked: (s) => s.memoryPairs >= 10 },
]

export function summarizeGames(records: GameRecord[]): AchievementSummary {
  const successesByGame = Object.fromEntries(GAME_ORDER.map((game) => [game, 0])) as Record<GameId, number>
  let memoryPairs = 0
  for (const r of records) {
    if (r.result === 'win' || r.result === 'completed') successesByGame[r.game]++
    if (r.game === 'memory' && typeof r.details?.pairs === 'number') memoryPairs += r.details.pairs
  }
  return { gamesPlayed: records.length, successesByGame, memoryPairs }
}

export function evaluateAchievements(summary: AchievementSummary): string[] {
  return ACHIEVEMENT_RULES.filter((rule) => rule.unlocked(summary)).map((rule) => rule.id)
}
