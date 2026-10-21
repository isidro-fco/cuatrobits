import type { Queryable } from '../config/database.js'

export interface PlayerRow {
  id: string
  username: string
  username_normalized: string
  avatar: string
  recovery_hash: string | null
  created_at: Date
}

export interface PlayerWithProgress extends PlayerRow {
  xp: number
  level: number
  bits: number
}

/** Inserta el jugador; devuelve `null` si el id o el nombre normalizado ya existen */
export async function insertPlayer(
  db: Queryable,
  player: { id?: string; username: string; normalized: string; avatar: string },
): Promise<PlayerRow | null> {
  const { rows } = await db.query<PlayerRow>(
    `INSERT INTO players (id, username, username_normalized, avatar)
     VALUES (COALESCE($1::uuid, gen_random_uuid()), $2, $3, $4)
     ON CONFLICT DO NOTHING
     RETURNING *`,
    [player.id ?? null, player.username, player.normalized, player.avatar],
  )
  if (rows[0]) await db.query('INSERT INTO progress (player_id) VALUES ($1)', [rows[0].id])
  return rows[0] ?? null
}

export async function findPlayerById(db: Queryable, id: string): Promise<PlayerWithProgress | null> {
  const { rows } = await db.query<PlayerWithProgress>(
    `SELECT p.*, COALESCE(g.xp, 0) AS xp, COALESCE(g.level, 1) AS level, COALESCE(g.bits, 0) AS bits
     FROM players p LEFT JOIN progress g ON g.player_id = p.id
     WHERE p.id = $1`,
    [id],
  )
  return rows[0] ?? null
}

export async function findPlayerByNormalizedName(db: Queryable, normalized: string): Promise<PlayerRow | null> {
  const { rows } = await db.query<PlayerRow>('SELECT * FROM players WHERE username_normalized = $1', [normalized])
  return rows[0] ?? null
}

/** Guarda la huella del código solo si el jugador aún no tiene uno; devuelve si se guardó */
export async function setRecoveryHash(db: Queryable, playerId: string, hash: string): Promise<boolean> {
  const { rows } = await db.query(
    'UPDATE players SET recovery_hash = $2 WHERE id = $1 AND recovery_hash IS NULL RETURNING id',
    [playerId, hash],
  )
  return rows.length > 0
}

/** Suma experiencia y Bits, y recalcula el nivel con la función recibida */
export async function addRewards(
  db: Queryable,
  playerId: string,
  rewards: { xp: number; bits: number },
  levelFromXp: (xp: number) => number,
): Promise<void> {
  const { rows } = await db.query<{ xp: number }>(
    `INSERT INTO progress (player_id, xp, bits) VALUES ($1, $2, $3)
     ON CONFLICT (player_id) DO UPDATE
       SET xp = progress.xp + EXCLUDED.xp, bits = progress.bits + EXCLUDED.bits, updated_at = now()
     RETURNING xp`,
    [playerId, rewards.xp, rewards.bits],
  )
  await db.query('UPDATE progress SET level = $2 WHERE player_id = $1', [playerId, levelFromXp(rows[0].xp)])
}

/** Descuenta Bits solo si alcanzan; devuelve el saldo restante o `null` si no alcanzan */
export async function spendBits(db: Queryable, playerId: string, amount: number): Promise<number | null> {
  const { rows } = await db.query<{ bits: number }>(
    `UPDATE progress SET bits = bits - $2, updated_at = now()
     WHERE player_id = $1 AND bits >= $2
     RETURNING bits`,
    [playerId, amount],
  )
  return rows[0]?.bits ?? null
}
