import { PGlite } from '@electric-sql/pglite'
import pg from 'pg'

export interface Queryable {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>
}

export interface Executor extends Queryable {
  /** Ejecuta varias sentencias SQL sin parámetros */
  exec(sql: string): Promise<void>
}

/** Acceso a la base de datos común a PostgreSQL (`pg`) y PGlite */
export interface Database extends Executor {
  /** Ejecuta `fn` dentro de una transacción; se revierte si lanza un error */
  transaction<T>(fn: (tx: Executor) => Promise<T>): Promise<T>
  close(): Promise<void>
}

export interface PgOptions {
  ssl?: 'off' | 'verify' | 'no-verify'
  caCert?: string
  poolMax?: number
}

/**
 * Configuración de `pg.Pool`. Se quita `sslmode` de la URL porque `pg` le da prioridad sobre
 * la opción `ssl`, y así el cifrado depende solo de `DATABASE_SSL`.
 */
export function pgPoolConfig(connectionString: string, { ssl = 'off', caCert, poolMax }: PgOptions = {}): pg.PoolConfig {
  const url = new URL(connectionString)
  url.searchParams.delete('sslmode')
  const config: pg.PoolConfig = { connectionString: url.toString(), max: poolMax }
  if (ssl === 'verify') {
    if (!caCert) throw new Error('DATABASE_SSL=verify requiere el certificado en DATABASE_CA_CERT.')
    // Las variables de entorno de una sola línea suelen guardar los saltos como \n
    config.ssl = { ca: caCert.replace(/\\n/g, '\n'), rejectUnauthorized: true }
  } else if (ssl === 'no-verify') {
    config.ssl = { rejectUnauthorized: false }
  }
  return config
}

export function createPgDatabase(connectionString: string, options?: PgOptions): Database {
  const pool = new pg.Pool(pgPoolConfig(connectionString, options))
  const query = async <T>(sql: string, params?: unknown[]) => {
    const result = await pool.query(sql, params)
    return { rows: result.rows as T[] }
  }
  return {
    query,
    async transaction(fn) {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        const result = await fn({
          query: async <T>(sql: string, params?: unknown[]) => ({ rows: (await client.query(sql, params)).rows as T[] }),
          async exec(sql) {
            await client.query(sql)
          },
        })
        await client.query('COMMIT')
        return result
      } catch (err) {
        await client.query('ROLLBACK')
        throw err
      } finally {
        client.release()
      }
    },
    async exec(sql) {
      await pool.query(sql)
    },
    close: () => pool.end(),
  }
}

/** `dataDir` vacío o `memory` crea una base de datos en memoria */
export function createPgliteDatabase(dataDir?: string): Database {
  const db = new PGlite(dataDir && dataDir !== 'memory' ? dataDir : undefined)
  return {
    query: (sql, params) => db.query(sql, params),
    transaction: (fn) =>
      db.transaction((tx) =>
        fn({
          query: (sql, params) => tx.query(sql, params),
          async exec(sql) {
            await tx.exec(sql)
          },
        }),
      ),
    async exec(sql) {
      await db.exec(sql)
    },
    close: () => db.close(),
  }
}

export function createDatabase(url: string, options?: PgOptions): Database {
  if (url.startsWith('pglite://')) return createPgliteDatabase(url.slice('pglite://'.length))
  return createPgDatabase(url, options)
}

/** Opciones de PostgreSQL tomadas de las variables de entorno */
export const pgOptionsFromEnv = (env: { DATABASE_SSL: PgOptions['ssl']; DATABASE_CA_CERT?: string; DATABASE_POOL_MAX: number }) => ({
  ssl: env.DATABASE_SSL,
  caCert: env.DATABASE_CA_CERT,
  poolMax: env.DATABASE_POOL_MAX,
})
