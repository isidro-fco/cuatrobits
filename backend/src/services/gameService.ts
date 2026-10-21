import type { Database } from '../config/database.js'
import { forbidden } from '../middleware/auth.js'
import { AppError, notFound } from '../models/errors.js'
import { evaluateAchievements } from '../models/achievements.js'
import { levelFromXp } from '../models/rules.js'
import { gameSchema } from '../models/schemas.js'
import { parse } from '../models/validate.js'
import { achievementSummary, unlockAchievements } from '../repositories/achievementRepository.js'
import { findGameOwner, insertGame } from '../repositories/gameRepository.js'
import { addRewards, findPlayerById } from '../repositories/playerRepository.js'

export type SaveStatus = 'created' | 'duplicate'

export interface SyncResult {
  id: string | null
  status: SaveStatus | 'rejected'
  error?: { code: string; message: string; details?: unknown }
}

/**
 * Guarda una partida terminada, suma sus recompensas y desbloquea los logros que correspondan.
 * Es idempotente: reenviar la misma partida no crea otra copia ni vuelve a sumar experiencia,
 * Bits o logros (secciones 4.3, 9.3 y 13.4). Solo el jugador autenticado (`ownerId`) puede guardar sus partidas.
 */
export async function saveGame(
  db: Database,
  input: unknown,
  ownerId: string,
): Promise<{ id: string; status: SaveStatus }> {
  const game = parse(gameSchema, input, 'La partida no es válida.')
  if (game.playerId !== ownerId) throw forbidden()
  if (!(await findPlayerById(db, game.playerId))) throw notFound('No existe el jugador de la partida.')

  const created = await db.transaction(async (tx) => {
    const inserted = await insertGame(tx, game)
    if (!inserted) return false
    await addRewards(tx, game.playerId, { xp: game.xpEarned, bits: game.bitsEarned ?? 0 }, levelFromXp)
    await unlockAchievements(tx, game.playerId, evaluateAchievements(await achievementSummary(tx, game.playerId)))
    return true
  })
  if (created) return { id: game.id, status: 'created' }

  const owner = await findGameOwner(db, game.id)
  if (owner !== game.playerId) {
    throw new AppError(409, 'id-conflict', 'El identificador de la partida pertenece a otro jugador.')
  }
  return { id: game.id, status: 'duplicate' }
}

/** Procesa un lote; cada partida se confirma o rechaza por separado */
export async function syncGames(db: Database, games: unknown[], ownerId: string): Promise<SyncResult[]> {
  const results: SyncResult[] = []
  for (const input of games) {
    const id =
      typeof input === 'object' && input !== null && typeof (input as { id?: unknown }).id === 'string'
        ? (input as { id: string }).id
        : null
    try {
      results.push(await saveGame(db, input, ownerId))
    } catch (err) {
      if (!(err instanceof AppError)) throw err
      results.push({ id, status: 'rejected', error: { code: err.code, message: err.message, details: err.details } })
    }
  }
  return results
}
