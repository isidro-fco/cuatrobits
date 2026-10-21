import { describe, expect, it } from 'vitest'
import { COSMETICS } from '../../../frontend/src/data/cosmetics.js'
import * as frontendAchievements from '../../../frontend/src/utils/achievements.js'
import * as frontendProgression from '../../../frontend/src/utils/progression.js'
import * as frontendRewards from '../../../frontend/src/utils/rewards.js'
import { type AchievementSummary, evaluateAchievements } from '../models/achievements.js'
import { ITEM_PRICES } from '../models/cosmetics.js'
import { bitsForGame, GAME_IDS, levelFromXp, RESULTS_BY_GAME, xpForGame, xpForNextLevel } from '../models/rules.js'
import { normalizeUsername } from '../models/schemas.js'
import { normalizeUsername as frontendNormalize } from '../../../frontend/src/utils/username.js'

// El frontend calcula la XP que envía; si las tablas no coinciden, el servidor rechazaría las partidas
describe('reglas compartidas con el frontend', () => {
  it('la experiencia por partida coincide', () => {
    for (const game of GAME_IDS) {
      for (const result of RESULTS_BY_GAME[game]) {
        expect(xpForGame(game, result)).toBe(frontendRewards.xpForGame(game, result))
      }
    }
  })

  it('los Bits por partida coinciden', () => {
    for (const game of GAME_IDS) {
      for (const result of RESULTS_BY_GAME[game]) expect(bitsForGame(result)).toBe(frontendRewards.bitsForGame(result))
    }
  })

  it('las condiciones de los logros coinciden', () => {
    // Recorre combinaciones alrededor de cada umbral
    for (const gamesPlayed of [0, 1, 4, 5, 20]) {
      for (const bitbot of [0, 1, 9, 10]) {
        for (const ballSort of [0, 4, 5]) {
          for (const memoryPairs of [0, 8, 10]) {
            for (const others of [0, 1]) {
              const summary: AchievementSummary = {
                gamesPlayed,
                successesByGame: { 'connect-four': others, bitbot, 'ball-sort': ballSort, memory: others },
                memoryPairs,
              }
              expect(evaluateAchievements(summary)).toEqual(frontendAchievements.evaluateAchievements(summary))
            }
          }
        }
      }
    }
  })

  it('los precios de los artículos coinciden', () => {
    expect(Object.fromEntries(COSMETICS.map((item) => [item.id, item.price]))).toEqual(ITEM_PRICES)
  })

  it('la tabla de niveles coincide', () => {
    for (let xp = 0; xp <= 5000; xp += 37) expect(levelFromXp(xp)).toBe(frontendProgression.levelFromXp(xp).level)
    for (let level = 1; level < 20; level++) expect(xpForNextLevel(level)).toBe(frontendProgression.xpForNextLevel(level))
  })

  it('la normalización de nombres coincide', () => {
    for (const name of ['Luna', 'JUGADOR01', '  Peña ', 'Ángel']) expect(normalizeUsername(name)).toBe(frontendNormalize(name))
  })
})
