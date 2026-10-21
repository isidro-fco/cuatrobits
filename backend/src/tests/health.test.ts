import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestApp } from './helpers.js'

let ctx: Awaited<ReturnType<typeof createTestApp>>
beforeAll(async () => {
  ctx = await createTestApp()
})
afterAll(() => ctx.close())

describe('GET /api/health', () => {
  it('responde con estado ok y la base de datos disponible', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/api/health' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ status: 'ok', database: 'ok' })
  })

  it('responde 503 si la base de datos no está disponible', async () => {
    const { buildApp } = await import('../app.js')
    const app = buildApp({
      logger: false,
      db: { ...ctx.db, query: () => Promise.reject(new Error('sin conexión')) },
    })
    const res = await app.inject({ method: 'GET', url: '/api/health' })
    expect(res.statusCode).toBe(503)
    await app.close()
  })
})
