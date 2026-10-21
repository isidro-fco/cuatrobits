import { describe, expect, it } from 'vitest'
import { pgPoolConfig } from '../config/database.js'

describe('conexión con PostgreSQL en producción', () => {
  const url = 'postgres://postgres.abc:p%40ss%2Fw@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require'

  it('quita sslmode de la URL y conserva la contraseña codificada', () => {
    const config = pgPoolConfig(url)
    expect(config.connectionString).toBe('postgres://postgres.abc:p%40ss%2Fw@aws-0-us-east-1.pooler.supabase.com:5432/postgres')
    expect(config.ssl).toBeUndefined()
  })

  it('verify exige el certificado y acepta los saltos de línea escritos como \\n', () => {
    expect(() => pgPoolConfig(url, { ssl: 'verify' })).toThrow(/DATABASE_CA_CERT/)
    const config = pgPoolConfig(url, { ssl: 'verify', caCert: '-----BEGIN-----\\nABC\\n-----END-----' })
    expect(config.ssl).toEqual({ ca: '-----BEGIN-----\nABC\n-----END-----', rejectUnauthorized: true })
  })

  it('no-verify cifra sin verificar y el tamaño del pool se respeta', () => {
    expect(pgPoolConfig(url, { ssl: 'no-verify', poolMax: 3 })).toMatchObject({ ssl: { rejectUnauthorized: false }, max: 3 })
  })
})
