/**
 * Archivo: migraciones.ts
 * Módulo: backend / config
 * Descripción: Aplica en orden los archivos SQL de database/migrations que aún no están registrados
 *              y vuelve a ejecutar los seeds.
 * Requerimientos: RIE02, RDC07, RDC10
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

// ---------- Módulos internos ----------
import type { BaseDatos } from './baseDatos.js'

// ---------- Constantes ----------
/** Migración que se da por aplicada en bases creadas antes de existir el registro */
const LINEA_BASE = '001_esquema_inicial.sql'

/** Carpeta database/ del repositorio, con migrations/ y seeds/ */
export const DIRECTORIO_BASE_DATOS = fileURLToPath(new URL('../../../database/', import.meta.url))

// ---------- Funciones ----------
async function archivosSql(directorio: string): Promise<string[]> {
  return (await readdir(directorio)).filter((archivo) => archivo.endsWith('.sql')).sort()
}

/**
 * Aplica las migraciones pendientes en orden y vuelve a cargar los datos iniciales. Las migraciones
 * aplicadas se registran en `migraciones_aplicadas`; las semillas deben ser idempotentes.
 * @param baseDatos Conexión con la base de datos o transacción en curso
 * @param directorio Carpeta database con migrations y seeds
 * @returns Nombres de las migraciones aplicadas en esta ejecución
 * @see RIE02, RDC07, RDC10
 */
export async function migrar(
  baseDatos: BaseDatos,
  directorio = DIRECTORIO_BASE_DATOS,
): Promise<string[]> {
  // Bases anteriores a la migración 006 tienen el registro con su nombre en inglés
  await baseDatos.ejecutar(`DO $$
  BEGIN
    IF to_regclass('public.schema_migrations') IS NOT NULL
      AND to_regclass('public.migraciones_aplicadas') IS NULL THEN
      ALTER TABLE schema_migrations RENAME TO migraciones_aplicadas;
      ALTER TABLE migraciones_aplicadas RENAME COLUMN name TO nombre;
      ALTER TABLE migraciones_aplicadas RENAME COLUMN applied_at TO aplicada_en;
    END IF;
  END $$`)
  await baseDatos.ejecutar(`CREATE TABLE IF NOT EXISTS migraciones_aplicadas (
    nombre      TEXT PRIMARY KEY,
    aplicada_en TIMESTAMPTZ NOT NULL DEFAULT now()
  )`)
  const { filas } = await baseDatos.consulta<{ nombre: string }>(
    'SELECT nombre FROM migraciones_aplicadas',
  )
  const aplicadas = new Set(filas.map((fila) => fila.nombre))

  // Bases creadas antes de existir este registro (aplicando el SQL con psql): se toma como línea
  // base
  if (aplicadas.size === 0) {
    const { filas: existente } = await baseDatos.consulta<{ esExistente: boolean }>(
      'SELECT to_regclass(\'public.players\') IS NOT NULL AS "esExistente"',
    )
    if (existente[0].esExistente) {
      await baseDatos.consulta('INSERT INTO migraciones_aplicadas (nombre) VALUES ($1)', [
        LINEA_BASE,
      ])
      aplicadas.add(LINEA_BASE)
    }
  }
  const recienAplicadas: string[] = []

  for (const archivo of await archivosSql(join(directorio, 'migrations'))) {
    if (aplicadas.has(archivo)) {
      continue
    }
    const sql = await readFile(join(directorio, 'migrations', archivo), 'utf8')
    await baseDatos.transaccion(async (ejecutorTransaccion) => {
      await ejecutorTransaccion.ejecutar(sql)
      await ejecutorTransaccion.consulta('INSERT INTO migraciones_aplicadas (nombre) VALUES ($1)', [
        archivo,
      ])
    })
    recienAplicadas.push(archivo)
  }
  for (const archivo of await archivosSql(join(directorio, 'seeds'))) {
    await baseDatos.ejecutar(await readFile(join(directorio, 'seeds', archivo), 'utf8'))
  }
  return recienAplicadas
}
