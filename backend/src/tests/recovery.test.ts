import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { hashRecoveryCode, normalizeRecoveryCode, verifyRecoveryCode } from '../models/recovery.js'
import { AttemptLimiter } from '../services/recoveryService.js'
import { auth, createTestApp, memoryGame, newToken, tokenFor } from './helpers.js'

let ctx: Awaited<ReturnType<typeof createTestApp>>
beforeAll(async () => {
  ctx = await createTestApp()
})
// El límite de intentos dura toda la aplicación: cada prueba usa nombres propios
beforeEach(() => ctx.reset())
afterAll(() => ctx.close())

const createPlayer = (body: { username: string } & Record<string, unknown>) =>
  ctx.app.inject({ method: 'POST', url: '/api/players', payload: { token: tokenFor(body.username), ...body } })
const recover = (username: string, code: string, token = newToken()) =>
  ctx.app.inject({ method: 'POST', url: '/api/players/recover', payload: { username, code, token } })

describe('código secreto', () => {
  it('tiene el formato ABCD-EFGH sin caracteres confusos', async () => {
    const { recoveryCode } = (await createPlayer({ username: 'Luna', avatar: 'cat' })).json()
    expect(recoveryCode).toMatch(/^[A-HJKMNP-TW-Z2-9]{4}-[A-HJKMNP-TW-Z2-9]{4}$/)
  })

  it('se guarda cifrado y acepta minúsculas y espacios', async () => {
    const hash = await hashRecoveryCode('ABCD-EFGH')
    expect(hash).not.toContain('ABCD')
    expect(await verifyRecoveryCode(' abcd efgh ', hash)).toBe(true)
    expect(await verifyRecoveryCode('ABCD-EFGJ', hash)).toBe(false)
    expect(normalizeRecoveryCode('ab-cd ef')).toBe('ABCDEF')
  })

  it('solo se entrega al crear el perfil, no en los reintentos', async () => {
    const id = randomUUID()
    const first = await createPlayer({ id, username: 'Sol', avatar: 'dino' })
    const retry = await createPlayer({ id, username: 'Sol', avatar: 'dino' })
    expect(first.json().recoveryCode).toBeDefined()
    expect(retry.json().recoveryCode).toBeUndefined()
  })
})

describe('POST /api/players/recover', () => {
  it('devuelve el perfil completo con su historial', async () => {
    const { id, recoveryCode } = (await createPlayer({ username: 'Luna', avatar: 'cat' })).json()
    const game = memoryGame(id, { bitsEarned: 5 })
    await ctx.app.inject({ headers: auth('Luna'), method: 'POST', url: '/api/games', payload: game })

    const res = await recover('LUNA', recoveryCode.toLowerCase())
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.player).toMatchObject({
      id,
      username: 'Luna',
      avatar: 'cat',
      progress: { xp: 20, bits: 5 },
      hasRecoveryCode: true,
      achievements: [{ id: 'first-game' }, { id: 'first-win' }],
      items: [],
    })
    expect(body.games).toEqual([
      expect.objectContaining({ id: game.id, game: 'memory', summary: game.summary, bitsEarned: 5 }),
    ])
  })

  it('autoriza el token del nuevo dispositivo sin cerrar la sesión de los demás', async () => {
    const { id, recoveryCode } = (await createPlayer({ username: 'Luna', avatar: 'cat' })).json()
    const token = newToken()
    expect((await recover('Luna', recoveryCode, token)).statusCode).toBe(200)
    const get = (t: string) => ctx.app.inject({ headers: auth(t), method: 'GET', url: `/api/players/${id}` })
    expect((await get(token)).statusCode).toBe(200)
    expect((await get('Luna')).statusCode).toBe(200)
  })

  it('un código incorrecto no autoriza el token', async () => {
    const { id } = (await createPlayer({ username: 'Luna', avatar: 'cat' })).json()
    const token = newToken()
    await recover('Luna', 'AAAA-AAAA', token)
    expect((await ctx.app.inject({ headers: auth(token), method: 'GET', url: `/api/players/${id}` })).statusCode).toBe(401)
  })

  it('rechaza un código incorrecto o un nombre inexistente con el mismo mensaje', async () => {
    await createPlayer({ username: 'Luna', avatar: 'cat' })
    const wrong = await recover('Luna', 'AAAA-AAAA')
    const missing = await recover('Nadie', 'AAAA-AAAA')
    expect(wrong.statusCode).toBe(401)
    expect(missing.statusCode).toBe(401)
    expect(wrong.json()).toEqual(missing.json())
  })

  it('bloquea después de cinco intentos fallidos, aunque luego llegue el código correcto', async () => {
    const { recoveryCode } = (await createPlayer({ username: 'Estrella', avatar: 'cat' })).json()
    for (let i = 0; i < 5; i++) expect((await recover('Estrella', 'AAAA-AAAA')).statusCode).toBe(401)
    const blocked = await recover('Estrella', recoveryCode)
    expect(blocked.statusCode).toBe(429)
    expect(blocked.json().error).toBe('too-many-attempts')
  })
})

describe('POST /api/players/:id/recovery-code', () => {
  it('crea el código de un perfil que no tenía y solo una vez', async () => {
    const { id } = (await createPlayer({ username: 'Nube', avatar: 'cat' })).json()
    await ctx.db.query('UPDATE players SET recovery_hash = NULL WHERE id = $1', [id])
    expect((await ctx.app.inject({ headers: auth('Nube'), method: 'GET', url: `/api/players/${id}` })).json().hasRecoveryCode).toBe(false)

    const res = await ctx.app.inject({ headers: auth('Nube'), method: 'POST', url: `/api/players/${id}/recovery-code` })
    expect(res.statusCode).toBe(201)
    expect((await recover('Nube', res.json().recoveryCode)).statusCode).toBe(200)

    const again = await ctx.app.inject({ headers: auth('Nube'), method: 'POST', url: `/api/players/${id}/recovery-code` })
    expect(again.statusCode).toBe(409)
    expect(again.json().error).toBe('code-exists')
  })

  it('exige el token del jugador', async () => {
    const { id } = (await createPlayer({ username: 'Nube', avatar: 'cat' })).json()
    await ctx.db.query('UPDATE players SET recovery_hash = NULL WHERE id = $1', [id])
    const res = await ctx.app.inject({ method: 'POST', url: `/api/players/${id}/recovery-code` })
    expect(res.statusCode).toBe(401)
    const other = await ctx.app.inject({ headers: auth('Nube'), method: 'POST', url: `/api/players/${randomUUID()}/recovery-code` })
    expect(other.statusCode).toBe(403)
  })
})

describe('AttemptLimiter', () => {
  it('se libera al pasar la ventana de tiempo', () => {
    let now = 0
    const limiter = new AttemptLimiter(2, 1000, () => now)
    limiter.fail('luna')
    limiter.fail('luna')
    expect(limiter.isBlocked('luna')).toBe(true)
    expect(limiter.isBlocked('sol')).toBe(false)
    now = 1001
    expect(limiter.isBlocked('luna')).toBe(false)
  })
})
