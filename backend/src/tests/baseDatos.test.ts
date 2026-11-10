/**
 * Archivo: baseDatos.test.ts
 * Módulo: backend / tests
 * Descripción: Pruebas de la configuración de conexión con PostgreSQL en producción.
 * Requerimientos: RDC07
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { describe, expect, it } from 'vitest'

// ---------- Módulos internos ----------
import { configuracionPoolPg } from '../config/baseDatos.js'

// ---------- Pruebas ----------
describe('conexión con PostgreSQL en producción', () => {
  const url =
    'postgres://postgres.abc:p%40ss%2Fw@aws-0-us-east-1.pooler.supabase.com:5432/' +
    'postgres?sslmode=require'

  it('quita sslmode de la URL y conserva la contraseña codificada', () => {
    const configuracion = configuracionPoolPg(url)
    expect(configuracion.connectionString).toBe(
      'postgres://postgres.abc:p%40ss%2Fw@aws-0-us-east-1.pooler.supabase.com:5432/postgres',
    )
    expect(configuracion.ssl).toBeUndefined()
  })

  it('verify exige el certificado y acepta los saltos de línea escritos como \\n', () => {
    expect(() => configuracionPoolPg(url, { ssl: 'verify' })).toThrow(/DATABASE_CA_CERT/)
    const configuracion = configuracionPoolPg(url, {
      ssl: 'verify',
      certificadoCa: '-----BEGIN-----\\nABC\\n-----END-----',
    })
    expect(configuracion.ssl).toEqual({
      ca: '-----BEGIN-----\nABC\n-----END-----',
      rejectUnauthorized: true,
    })
  })

  it('no-verify cifra sin verificar y el tamaño del pool se respeta', () => {
    expect(configuracionPoolPg(url, { ssl: 'no-verify', maximoConexiones: 3 })).toMatchObject({
      ssl: { rejectUnauthorized: false },
      max: 3,
    })
  })
})
