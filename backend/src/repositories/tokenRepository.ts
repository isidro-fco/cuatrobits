import type { Queryable } from '../config/database.js'

/** Dispositivos con sesión por jugador; al pasar el límite se descartan los más antiguos */
const MAX_TOKENS_PER_PLAYER = 10

/** Registra el token para el jugador; devuelve `false` si esa huella ya pertenece a otro jugador */
export async function addToken(db: Queryable, playerId: string, tokenHash: string): Promise<boolean> {
  await db.query('INSERT INTO player_tokens (token_hash, player_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
    tokenHash,
    playerId,
  ])
  await db.query(
    `DELETE FROM player_tokens WHERE player_id = $1 AND token_hash NOT IN (
       SELECT token_hash FROM player_tokens WHERE player_id = $1 ORDER BY created_at DESC LIMIT $2)`,
    [playerId, MAX_TOKENS_PER_PLAYER],
  )
  return (await findTokenOwner(db, tokenHash)) === playerId
}

export async function findTokenOwner(db: Queryable, tokenHash: string): Promise<string | null> {
  const { rows } = await db.query<{ player_id: string }>('SELECT player_id FROM player_tokens WHERE token_hash = $1', [
    tokenHash,
  ])
  return rows[0]?.player_id ?? null
}

export async function countTokens(db: Queryable, playerId: string): Promise<number> {
  const { rows } = await db.query<{ count: number }>(
    'SELECT COUNT(*)::int AS count FROM player_tokens WHERE player_id = $1',
    [playerId],
  )
  return rows[0].count
}
