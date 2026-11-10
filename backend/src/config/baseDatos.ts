/**
 * Archivo: baseDatos.ts
 * Módulo: backend / config
 * Descripción: Conexión con PostgreSQL (pg) o con PGlite en memoria, con una interfaz común para
 *              consultas y transacciones.
 * Requerimientos: RIE02, RDC07, RDC08
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { PGlite } from '@electric-sql/pglite'
import pg from 'pg'

// ---------- Tipos ----------
export interface Consultable {
  consulta<TipoDato = Record<string, unknown>>(
    sql: string,
    parametros?: unknown[],
  ): Promise<{ filas: TipoDato[] }>
}

export interface Ejecutor extends Consultable {
  /** Ejecuta varias sentencias SQL sin parámetros */
  ejecutar(sql: string): Promise<void>
}

/** Acceso a la base de datos común a PostgreSQL (`pg`) y PGlite */
export interface BaseDatos extends Ejecutor {
  /** Ejecuta `funcion` dentro de una transacción; se revierte si lanza un error */
  transaccion<TipoDatoActual>(
    funcion: (ejecutorTransaccion: Ejecutor) => Promise<TipoDatoActual>,
  ): Promise<TipoDatoActual>
  cerrar(): Promise<void>
}

export interface OpcionesPg {
  ssl?: 'off' | 'verify' | 'no-verify'
  certificadoCa?: string
  maximoConexiones?: number
}

// ---------- Funciones ----------
/**
 * Configuración de `pg.Pool`. Se quita `sslmode` de la URL porque `pg` le da prioridad sobre la
 * opción `ssl`, y así el cifrado depende solo de `DATABASE_SSL`.
 * @param urlConexion URL de conexión a PostgreSQL
 * @param opciones Opciones
 * @param opciones.ssl Modo de TLS
 * @param opciones.certificadoCa Certificado de la autoridad para verificar al servidor
 * @param opciones.maximoConexiones Conexiones simultáneas del pool
 * @returns Configuración del pool
 * @see RDC07
 */
export function configuracionPoolPg(
  urlConexion: string,
  { ssl = 'off', certificadoCa, maximoConexiones }: OpcionesPg = {},
): pg.PoolConfig {
  const url = new URL(urlConexion)
  url.searchParams.delete('sslmode')
  const configuracion: pg.PoolConfig = { connectionString: url.toString(), max: maximoConexiones }
  if (ssl === 'verify') {
    if (!certificadoCa) {
      throw new Error('DATABASE_SSL=verify requiere el certificado en DATABASE_CA_CERT.')
    }
    // Las variables de entorno de una sola línea suelen guardar los saltos como \n
    configuracion.ssl = { ca: certificadoCa.replace(/\\n/g, '\n'), rejectUnauthorized: true }
  } else if (ssl === 'no-verify') {
    configuracion.ssl = { rejectUnauthorized: false }
  }
  return configuracion
}

/**
 * Crea la conexión con un servidor PostgreSQL.
 * @param urlConexion URL de conexión a PostgreSQL
 * @param opciones Opciones de TLS y del pool
 * @returns Base de datos con consultas y transacciones
 * @see RIE02, RDC07
 */
export function crearBaseDatosPg(urlConexion: string, opciones?: OpcionesPg): BaseDatos {
  const grupoConexiones = new pg.Pool(configuracionPoolPg(urlConexion, opciones))
  const consulta = async <TipoDato>(sql: string, parametros?: unknown[]) => {
    const resultado = await grupoConexiones.query(sql, parametros)
    return { filas: resultado.rows as TipoDato[] }
  }
  return {
    consulta,
    async transaccion(funcion) {
      const cliente = await grupoConexiones.connect()
      try {
        await cliente.query('BEGIN')
        const resultado = await funcion({
          consulta: async <TipoDato>(sql: string, parametros?: unknown[]) => ({
            filas: (await cliente.query(sql, parametros)).rows as TipoDato[],
          }),
          async ejecutar(sql) {
            await cliente.query(sql)
          },
        })
        await cliente.query('COMMIT')
        return resultado
      } catch (errorCapturado) {
        await cliente.query('ROLLBACK')
        throw errorCapturado
      } finally {
        cliente.release()
      }
    },
    async ejecutar(sql) {
      await grupoConexiones.query(sql)
    },
    cerrar: () => grupoConexiones.end(),
  }
}

/**
 * `directorioDatos` vacío o `memory` crea una base de datos en memoria
 * @param directorioDatos Carpeta de datos; vacía o memory para usar memoria
 * @returns Base de datos con consultas y transacciones
 * @see RIE02, RDC07
 */
export function crearBaseDatosPglite(directorioDatos?: string): BaseDatos {
  const baseDatos = new PGlite(
    directorioDatos && directorioDatos !== 'memory' ? directorioDatos : undefined,
  )
  return {
    consulta: async <TipoDato>(sql: string, parametros?: unknown[]) => ({
      filas: (await baseDatos.query<TipoDato>(sql, parametros)).rows,
    }),
    transaccion: (funcion) =>
      baseDatos.transaction((ejecutorTransaccion) =>
        funcion({
          consulta: async <TipoDato>(sql: string, parametros?: unknown[]) => ({
            filas: (await ejecutorTransaccion.query<TipoDato>(sql, parametros)).rows,
          }),
          async ejecutar(sql) {
            await ejecutorTransaccion.exec(sql)
          },
        }),
      ),
    async ejecutar(sql) {
      await baseDatos.exec(sql)
    },
    cerrar: () => baseDatos.close(),
  }
}

/**
 * Crea la conexión según la URL: pglite:// usa PGlite y cualquier otra, PostgreSQL.
 * @param url URL de conexión
 * @param opciones Opciones de TLS y del pool
 * @returns Base de datos con consultas y transacciones
 * @see RIE02, RDC07
 */
export function crearBaseDatos(url: string, opciones?: OpcionesPg): BaseDatos {
  if (url.startsWith('pglite://')) {
    return crearBaseDatosPglite(url.slice('pglite://'.length))
  }
  return crearBaseDatosPg(url, opciones)
}

/**
 * Opciones de PostgreSQL tomadas de las variables de entorno
 * @param entorno Variables de entorno ya validadas
 * @returns Opciones de TLS y del pool
 * @see RDC07
 */
export const opcionesPgDesdeEntorno = (entorno: {
  DATABASE_SSL: OpcionesPg['ssl']
  DATABASE_CA_CERT?: string
  DATABASE_POOL_MAX: number
}) => ({
  ssl: entorno.DATABASE_SSL,
  certificadoCa: entorno.DATABASE_CA_CERT,
  maximoConexiones: entorno.DATABASE_POOL_MAX,
})
