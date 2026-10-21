import type { Queryable } from '../config/database.js'
import type { AchievementSummary } from '../models/achievements.js'
import { GAME_IDS, type GameId } from '../models/rules.js'

/** Totales de las partidas registradas que deciden los logros */
export async function achievementSummary(db: Queryable, playerId: string): Promise<AchievementSummary> {
  const { rows } = await db.query<{ game_type: GameId; played: number; successes: number; pairs: number }>(
    `SELECT g.game_type,
            count(*)::int AS played,
            count(*) FILTER (WHERE g.result IN ('win', 'completed'))::int AS successes,
            COALESCE(sum((d.details->>'pairs')::int) FILTER (WHERE g.game_type = 'memory'), 0)::int AS pairs
     FROM games g LEFT JOIN game_details d ON d.game_id = g.id
     WHERE g.player_id = $1
     GROUP BY g.game_type`,
    [playerId],
  )
  const row = (game: GameId) => rows.find((r) => r.game_type === game)
  return {
    gamesPlayed: rows.reduce((n, r) => n + r.played, 0),
    successesByGame: Object.fromEntries(GAME_IDS.map((game) => [game, row(game)?.successes ?? 0])) as Record<
      GameId,
      number
    >,
    memoryPairs: row('memory')?.pairs ?? 0,
  }
}

/** Registra los logros; los que ya tenía el jugador se ignoran. Devuelve solo los nuevos. */
export async function unlockAchievements(db: Queryable, playerId: string, ids: string[]): Promise<string[]> {
  const unlocked: string[] = []
  for (const id of ids) {
    const { rows } = await db.query<{ achievement_id: string }>(
      `INSERT INTO player_achievements (player_id, achievement_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING
       RETURNING achievement_id`,
      [playerId, id],
    )
    if (rows[0]) unlocked.push(rows[0].achievement_id)
  }
  return unlocked
}

export async function listAchievements(
  db: Queryable,
  playerId: string,
): Promise<{ achievement_id: string; unlocked_at: Date }[]> {
  const { rows } = await db.query<{ achievement_id: string; unlocked_at: Date }>(
    'SELECT achievement_id, unlocked_at FROM player_achievements WHERE player_id = $1 ORDER BY unlocked_at, achievement_id',
    [playerId],
  )
  return rows
}

export async function countAchievements(db: Queryable, playerId: string): Promise<number> {
  const { rows } = await db.query<{ total: number }>(
    'SELECT count(*)::int AS total FROM player_achievements WHERE player_id = $1',
    [playerId],
  )
  return rows[0].total
}
