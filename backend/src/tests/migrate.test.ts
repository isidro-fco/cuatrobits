import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createPgliteDatabase } from '../config/database.js'
import { DATABASE_DIR, migrate } from '../config/migrate.js'

describe('migraciones', () => {
  it('aplica el esquema una sola vez y carga los logros', async () => {
    const db = createPgliteDatabase()
    expect(await migrate(db)).toEqual([
      '001_esquema_inicial.sql',
      '002_bits_y_articulos.sql',
      '003_recuperacion_de_perfiles.sql',
      '004_autenticacion.sql',
      '005_seguridad_supabase.sql',
    ])
    expect(await migrate(db)).toEqual([])
    const { rows } = await db.query<{ total: number }>('SELECT count(*)::int AS total FROM achievements')
    expect(rows[0].total).toBe(7)
    await db.close()
  })

  it('reconoce una base creada antes con psql', async () => {
    const db = createPgliteDatabase()
    await db.exec(await readFile(join(DATABASE_DIR, 'migrations', '001_esquema_inicial.sql'), 'utf8'))
    // Solo se aplican las migraciones posteriores a la línea base
    expect(await migrate(db)).toEqual([
      '002_bits_y_articulos.sql',
      '003_recuperacion_de_perfiles.sql',
      '004_autenticacion.sql',
      '005_seguridad_supabase.sql',
    ])
    await db.close()
  })
})
