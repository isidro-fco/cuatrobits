import type { Queryable } from '../config/database.js'
import type { GameInput } from '../models/schemas.js'

export interface GameRow {
  id: string
  player_id: string
  game_type: string
  result: string
  duration_ms: number
  xp_earned: number
  bits_earned: number
  summary: string
  played_at: Date
  synced_at: Date
  details: Record<string, unknown> | null
}

/** Inserta la partida; devuelve `false` si ya existía una con el mismo id */
export async function insertGame(db: Queryable, game: GameInput): Promise<boolean> {
  const { rows } = await db.query<{ id: string }>(
    `INSERT INTO games (id, player_id, game_type, result, duration_ms, xp_earned, bits_earned, summary, played_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (id) DO NOTHING
     RETURNING id`,
    [game.id, game.playerId, game.game, game.result, game.durationMs, game.xpEarned, game.bitsEarned ?? 0, game.summary, game.playedAt],
  )
  if (rows.length === 0) return false
  await db.query('INSERT INTO game_details (game_id, details) VALUES ($1, $2)', [game.id, JSON.stringify(game.details)])
  return true
}

export async function findGameOwner(db: Queryable, id: string): Promise<string | null> {
  const { rows } = await db.query<{ player_id: string }>('SELECT player_id FROM games WHERE id = $1', [id])
  return rows[0]?.player_id ?? null
}

export async function listGames(
  db: Queryable,
  playerId: string,
  limit: number,
  offset: number,
): Promise<{ total: number; games: GameRow[] }> {
  const { rows: games } = await db.query<GameRow>(
    `SELECT g.*, d.details
     FROM games g LEFT JOIN game_details d ON d.game_id = g.id
     WHERE g.player_id = $1
     ORDER BY g.played_at DESC, g.id
     LIMIT $2 OFFSET $3`,
    [playerId, limit, offset],
  )
  const { rows } = await db.query<{ total: number }>('SELECT count(*)::int AS total FROM games WHERE player_id = $1', [
    playerId,
  ])
  return { total: rows[0].total, games }
}

export interface GameCountRow {
  game_type: string
  result: string
  count: number
}

export async function countGamesByResult(db: Queryable, playerId: string): Promise<GameCountRow[]> {
  const { rows } = await db.query<GameCountRow>(
    `SELECT game_type, result, count(*)::int AS count
     FROM games WHERE player_id = $1
     GROUP BY game_type, result`,
    [playerId],
  )
  return rows
}
