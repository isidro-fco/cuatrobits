import type { Database } from '../config/database.js'
import { hashToken } from '../models/auth.js'
import { AppError, notFound } from '../models/errors.js'
import { ITEM_PRICES, type ItemId } from '../models/cosmetics.js'
import { generateRecoveryCode, hashRecoveryCode } from '../models/recovery.js'
import { GAME_IDS, xpForNextLevel } from '../models/rules.js'
import { type CreatePlayerInput, normalizeUsername } from '../models/schemas.js'
import { countAchievements, listAchievements } from '../repositories/achievementRepository.js'
import { countGamesByResult, listGames, type GameRow } from '../repositories/gameRepository.js'
import { insertItem, listItems } from '../repositories/itemRepository.js'
import {
  findPlayerById,
  findPlayerByNormalizedName,
  insertPlayer,
  type PlayerRow,
  type PlayerWithProgress,
  setRecoveryHash,
  spendBits,
} from '../repositories/playerRepository.js'
import { addToken, countTokens, findTokenOwner } from '../repositories/tokenRepository.js'

export interface PlayerDto {
  id: string
  username: string
  avatar: string
  createdAt: string
}

const toPlayerDto = (row: PlayerRow): PlayerDto => ({
  id: row.id,
  username: row.username,
  avatar: row.avatar,
  createdAt: row.created_at.toISOString(),
})

const tokenInUse = () => new AppError(409, 'token-taken', 'Ese token ya pertenece a otro jugador.')

const usernameTaken = () => new AppError(409, 'username-taken', 'Ese nombre ya está en uso.')

/**
 * Registra un jugador y el token del dispositivo. Si llega un `id` que ya existe con el mismo nombre:
 * - con el mismo token es un reintento y devuelve el registro existente, sin duplicados;
 * - si el perfil aún no tiene tokens (se creó antes de existir la autenticación), lo reclama este dispositivo;
 * - si ya pertenece a otro dispositivo responde 409 `profile-claimed`: hay que recuperarlo con el código.
 * Al crearlo devuelve, una sola vez, el código secreto para recuperar el perfil.
 */
export async function createPlayer(
  db: Database,
  input: CreatePlayerInput,
): Promise<{ created: boolean; player: PlayerDto & { recoveryCode?: string } }> {
  const normalized = normalizeUsername(input.username)
  const tokenHash = hashToken(input.token)
  const recoveryCode = generateRecoveryCode()
  const recoveryHash = await hashRecoveryCode(recoveryCode)
  const row = await db.transaction(async (tx) => {
    const inserted = await insertPlayer(tx, { id: input.id, username: input.username, normalized, avatar: input.avatar })
    if (inserted) {
      await setRecoveryHash(tx, inserted.id, recoveryHash)
      if (!(await addToken(tx, inserted.id, tokenHash))) throw tokenInUse()
    }
    return inserted
  })
  if (row) return { created: true, player: { ...toPlayerDto(row), recoveryCode } }

  const sameName = await findPlayerByNormalizedName(db, normalized)
  if (input.id && sameName?.id === input.id) {
    const id = input.id
    const claimed = await db.transaction(async (tx) => {
      // Bloquea la fila para que dos dispositivos no reclamen a la vez el mismo perfil antiguo
      await tx.query('SELECT id FROM players WHERE id = $1 FOR UPDATE', [id])
      if ((await findTokenOwner(tx, tokenHash)) === id) return true
      if ((await countTokens(tx, id)) > 0) return false
      return addToken(tx, id, tokenHash)
    })
    if (!claimed) {
      throw new AppError(409, 'profile-claimed', 'Este perfil ya está protegido. Recupéralo con tu código secreto.')
    }
    return { created: false, player: toPlayerDto(sameName) }
  }
  if (sameName) throw usernameTaken()
  throw new AppError(409, 'id-taken', 'El identificador ya pertenece a otro jugador.')
}

export async function requirePlayer(db: Database, id: string): Promise<PlayerWithProgress> {
  const player = await findPlayerById(db, id)
  if (!player) throw notFound('No existe un jugador con ese identificador.')
  return player
}

export async function getPlayer(db: Database, id: string) {
  const player = await requirePlayer(db, id)
  return {
    ...toPlayerDto(player),
    progress: { xp: player.xp, level: player.level, bits: player.bits, xpForNextLevel: xpForNextLevel(player.level) },
    hasRecoveryCode: player.recovery_hash !== null,
    achievements: (await listAchievements(db, id)).map((a) => ({
      id: a.achievement_id,
      unlockedAt: a.unlocked_at.toISOString(),
    })),
    items: await listItems(db, id),
  }
}

/**
 * Compra un artículo de BitBot con los Bits del servidor (sección 9.4). Es idempotente:
 * comprar de nuevo un artículo que ya tiene no cobra otra vez.
 */
export async function buyItem(db: Database, id: string, itemId: ItemId) {
  await requirePlayer(db, id)
  const price = ITEM_PRICES[itemId]
  const bought = await db.transaction(async (tx) => {
    if (!(await insertItem(tx, id, itemId, price))) return false
    if ((await spendBits(tx, id, price)) === null) {
      throw new AppError(409, 'insufficient-bits', 'No tienes Bits suficientes para este artículo.')
    }
    return true
  })
  const player = await requirePlayer(db, id)
  return { status: bought ? ('created' as const) : ('duplicate' as const), itemId, bits: player.bits }
}

export const toGameDto = (row: GameRow) => ({
  id: row.id,
  game: row.game_type,
  result: row.result,
  durationMs: row.duration_ms,
  xpEarned: row.xp_earned,
  bitsEarned: row.bits_earned,
  summary: row.summary,
  playedAt: row.played_at.toISOString(),
  syncedAt: row.synced_at.toISOString(),
  details: row.details,
})

export async function getHistory(db: Database, id: string, limit: number, offset: number) {
  await requirePlayer(db, id)
  const { total, games } = await listGames(db, id, limit, offset)
  return { total, limit, offset, games: games.map(toGameDto) }
}

/** Estadísticas acumuladas (sección 10) */
export async function getStats(db: Database, id: string) {
  const player = await requirePlayer(db, id)
  const rows = await countGamesByResult(db, id)
  const byGame = Object.fromEntries(
    GAME_IDS.map((game) => {
      const of = rows.filter((r) => r.game_type === game)
      const sum = (results: string[]) => of.filter((r) => results.includes(r.result)).reduce((n, r) => n + r.count, 0)
      return [game, { played: sum(['win', 'loss', 'draw', 'completed']), wins: sum(['win']), completed: sum(['completed']) }]
    }),
  )
  const total = (key: 'played' | 'wins' | 'completed') =>
    Object.values(byGame).reduce((n, g) => n + g[key], 0)

  return {
    gamesPlayed: total('played'),
    wins: total('wins'),
    levelsCompleted: byGame['ball-sort'].completed,
    achievements: await countAchievements(db, id),
    xp: player.xp,
    level: player.level,
    bits: player.bits,
    byGame,
  }
}
