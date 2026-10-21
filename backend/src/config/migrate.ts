import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Database } from './database.js'

const BASELINE = '001_esquema_inicial.sql'

export const DATABASE_DIR = fileURLToPath(new URL('../../../database/', import.meta.url))

async function sqlFiles(dir: string): Promise<string[]> {
  return (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort()
}

/**
 * Aplica las migraciones pendientes en orden y vuelve a cargar los datos iniciales.
 * Las migraciones aplicadas se registran en `schema_migrations`; las semillas deben ser idempotentes.
 */
export async function migrate(db: Database, dir = DATABASE_DIR): Promise<string[]> {
  await db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name       TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)
  const { rows } = await db.query<{ name: string }>('SELECT name FROM schema_migrations')
  const applied = new Set(rows.map((r) => r.name))

  // Bases creadas antes de existir este registro (aplicando el SQL con psql): se toma como línea base
  if (applied.size === 0) {
    const { rows: existing } = await db.query<{ exists: boolean }>(
      "SELECT to_regclass('public.players') IS NOT NULL AS exists",
    )
    if (existing[0].exists) {
      await db.query('INSERT INTO schema_migrations (name) VALUES ($1)', [BASELINE])
      applied.add(BASELINE)
    }
  }
  const newlyApplied: string[] = []

  for (const file of await sqlFiles(join(dir, 'migrations'))) {
    if (applied.has(file)) continue
    const sql = await readFile(join(dir, 'migrations', file), 'utf8')
    await db.transaction(async (tx) => {
      await tx.exec(sql)
      await tx.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file])
    })
    newlyApplied.push(file)
  }
  for (const file of await sqlFiles(join(dir, 'seeds'))) {
    await db.exec(await readFile(join(dir, 'seeds', file), 'utf8'))
  }
  return newlyApplied
}
