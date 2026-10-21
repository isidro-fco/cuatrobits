import type { Queryable } from '../config/database.js'

/** Registra la compra; devuelve `false` si el jugador ya tenía el artículo */
export async function insertItem(db: Queryable, playerId: string, itemId: string, price: number): Promise<boolean> {
  const { rows } = await db.query(
    `INSERT INTO player_items (player_id, item_id, price) VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING
     RETURNING item_id`,
    [playerId, itemId, price],
  )
  return rows.length > 0
}

export async function listItems(db: Queryable, playerId: string): Promise<string[]> {
  const { rows } = await db.query<{ item_id: string }>(
    'SELECT item_id FROM player_items WHERE player_id = $1 ORDER BY purchased_at, item_id',
    [playerId],
  )
  return rows.map((r) => r.item_id)
}
