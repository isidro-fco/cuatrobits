/**
 * Archivo: migraciones.test.ts
 * Módulo: backend / tests
 * Descripción: Pruebas de la aplicación de migraciones, incluido el renombrado al español (006).
 * Requerimientos: RIE02, RDC10
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// ---------- Módulos internos ----------
import { crearBaseDatosPglite } from '../config/baseDatos.js'
import { DIRECTORIO_BASE_DATOS, migrar } from '../config/migraciones.js'

// ---------- Pruebas ----------
describe('migraciones', () => {
  it('aplica el esquema una sola vez y carga los logros', async () => {
    const baseDatos = crearBaseDatosPglite()
    expect(await migrar(baseDatos)).toEqual([
      '001_esquema_inicial.sql',
      '002_bits_y_articulos.sql',
      '003_recuperacion_de_perfiles.sql',
      '004_autenticacion.sql',
      '005_seguridad_supabase.sql',
      '006_nombres_en_espanol.sql',
    ])
    expect(await migrar(baseDatos)).toEqual([])
    const { filas } = await baseDatos.consulta<{ total: number }>(
      'SELECT count(*)::int AS total FROM logros',
    )
    expect(filas[0].total).toBe(7)
    await baseDatos.cerrar()
  })

  it('reconoce una base creada antes con psql', async () => {
    const baseDatos = crearBaseDatosPglite()
    await baseDatos.ejecutar(
      await readFile(join(DIRECTORIO_BASE_DATOS, 'migrations', '001_esquema_inicial.sql'), 'utf8'),
    )
    // Solo se aplican las migraciones posteriores a la línea base
    expect(await migrar(baseDatos)).toEqual([
      '002_bits_y_articulos.sql',
      '003_recuperacion_de_perfiles.sql',
      '004_autenticacion.sql',
      '005_seguridad_supabase.sql',
      '006_nombres_en_espanol.sql',
    ])
    await baseDatos.cerrar()
  })

  it('conserva los datos y traduce las claves JSON al renombrar las tablas (006)', async () => {
    const baseDatos = crearBaseDatosPglite()
    const migraciones = join(DIRECTORIO_BASE_DATOS, 'migrations')
    // Simula la base de producción: registro antiguo (schema_migrations) y migraciones 001 a 005
    await baseDatos.ejecutar(`CREATE TABLE schema_migrations (
      name       TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
    const anteriores = [
      '001_esquema_inicial.sql',
      '002_bits_y_articulos.sql',
      '003_recuperacion_de_perfiles.sql',
      '004_autenticacion.sql',
    ]
    for (const archivo of anteriores) {
      await baseDatos.ejecutar(await readFile(join(migraciones, archivo), 'utf8'))
      await baseDatos.consulta('INSERT INTO schema_migrations (name) VALUES ($1)', [archivo])
    }
    await baseDatos.ejecutar('ALTER TABLE players ENABLE ROW LEVEL SECURITY')
    await baseDatos.consulta('INSERT INTO schema_migrations (name) VALUES ($1)', [
      '005_seguridad_supabase.sql',
    ])
    const jugadorId = '00000000-0000-4000-8000-000000000001'
    const partidaId = '00000000-0000-4000-8000-000000000002'
    await baseDatos.consulta(
      `INSERT INTO players (id, username, username_normalized, avatar) VALUES ($1, 'Luna', ` +
        `'luna', 'cat')`,
      [jugadorId],
    )
    await baseDatos.consulta(
      `INSERT INTO games (id, player_id, game_type, result, duration_ms, played_at)
       VALUES ($1, $2, 'memory', 'completed', 1000, now())`,
      [partidaId, jugadorId],
    )
    await baseDatos.consulta('INSERT INTO game_details (game_id, details) VALUES ($1, $2)', [
      partidaId,
      JSON.stringify({ category: 'animals', difficulty: 'easy', pairs: 4, attempts: 6 }),
    ])

    expect(await migrar(baseDatos)).toEqual(['006_nombres_en_espanol.sql'])

    const { filas: jugadores } = await baseDatos.consulta<{ username_normalizado: string }>(
      'SELECT username_normalizado FROM jugadores WHERE id = $1',
      [jugadorId],
    )
    expect(jugadores[0].username_normalizado).toBe('luna')
    const { filas: detalles } = await baseDatos.consulta<{ detalles: unknown }>(
      'SELECT detalles FROM detalles_partidas WHERE partida_id = $1',
      [partidaId],
    )
    expect(detalles[0].detalles).toEqual({
      categoria: 'animals',
      dificultad: 'easy',
      parejas: 4,
      intentos: 6,
    })
    const { filas: registro } = await baseDatos.consulta<{ nombre: string }>(
      'SELECT nombre FROM migraciones_aplicadas ORDER BY nombre',
    )
    expect(registro.map((fila) => fila.nombre)).toHaveLength(6)
    await baseDatos.cerrar()
  })
})
