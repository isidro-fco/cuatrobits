import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { ballSortGame, bitbotGame, connectFourGame, auth, createTestApp, memoryGame, tokenFor } from './helpers.js'

let ctx: Awaited<ReturnType<typeof createTestApp>>
let playerId: string

beforeAll(async () => {
  ctx = await createTestApp()
})
beforeEach(async () => {
  await ctx.reset()
  const res = await ctx.app.inject({ method: 'POST', url: '/api/players', payload: { username: 'Luna', avatar: 'cat', token: tokenFor('Luna') } })
  playerId = res.json().id
})
afterAll(() => ctx.close())

const postGame = (payload: object) => ctx.app.inject({ headers: auth('Luna'), method: 'POST', url: '/api/games', payload })
const profile = async () => (await ctx.app.inject({ headers: auth('Luna'), method: 'GET', url: `/api/players/${playerId}` })).json()
const unlocked = async () => (await profile()).achievements.map((a: { id: string }) => a.id)
const buy = (itemId: string) =>
  ctx.app.inject({ headers: auth('Luna'), method: 'POST', url: `/api/players/${playerId}/items`, payload: { itemId } })

describe('Bits por partida (sección 9.4)', () => {
  it('suma los Bits de cada partida y no los repite al reintentar', async () => {
    const game = connectFourGame(playerId, { bitsEarned: 5 })
    await postGame(game)
    await postGame(game)
    await postGame(connectFourGame(playerId, { result: 'loss', xpEarned: 10, bitsEarned: 2, details: { players: ['Luna', 'BitBot'], mode: 'ai', difficulty: 'normal', moves: 12, winner: 'BitBot' } }))
    expect((await profile()).progress.bits).toBe(7)
  })

  it('rechaza Bits que no corresponden al resultado', async () => {
    const res = await postGame(memoryGame(playerId, { bitsEarned: 999 }))
    expect(res.statusCode).toBe(400)
    expect((await profile()).progress.bits).toBe(0)
  })

  it('acepta partidas anteriores a la etapa 4 sin Bits', async () => {
    const res = await postGame(memoryGame(playerId))
    expect(res.statusCode).toBe(201)
    expect((await profile()).progress.bits).toBe(0)
  })

  it('el historial incluye los Bits de cada partida', async () => {
    await postGame(ballSortGame(playerId, { bitsEarned: 5 }))
    const history = (await ctx.app.inject({ headers: auth('Luna'), method: 'GET', url: `/api/players/${playerId}/history` })).json()
    expect(history.games[0].bitsEarned).toBe(5)
  })
})

describe('logros (sección 9.3)', () => {
  it('la primera partida y la primera victoria se desbloquean al registrar la partida', async () => {
    await postGame(connectFourGame(playerId, { result: 'loss', xpEarned: 10, details: { players: ['Luna', 'BitBot'], mode: 'ai', difficulty: 'easy', moves: 10, winner: 'BitBot' } }))
    expect(await unlocked()).toEqual(['first-game'])
    await postGame(bitbotGame(playerId))
    expect(await unlocked()).toEqual(['first-game', 'first-win'])
  })

  it('cinco partidas y una victoria en cada juego', async () => {
    for (const factory of [connectFourGame, bitbotGame, ballSortGame, memoryGame, memoryGame]) await postGame(factory(playerId))
    expect(await unlocked()).toEqual(expect.arrayContaining(['five-games', 'win-each-game']))
  })

  it('diez parejas de Memorama se cuentan entre partidas', async () => {
    await postGame(memoryGame(playerId))
    await postGame(memoryGame(playerId))
    expect(await unlocked()).not.toContain('memory-10')
    await postGame(memoryGame(playerId))
    expect(await unlocked()).toContain('memory-10')
  })

  it('diez palabras en BitBot y cinco niveles de esferas', async () => {
    for (let i = 0; i < 10; i++) await postGame(bitbotGame(playerId))
    for (let i = 0; i < 5; i++) await postGame(ballSortGame(playerId))
    expect(await unlocked()).toEqual(expect.arrayContaining(['bitbot-10', 'ball-sort-5']))
  })

  it('no se otorgan dos veces', async () => {
    await postGame(memoryGame(playerId))
    await postGame(memoryGame(playerId))
    const stats = (await ctx.app.inject({ headers: auth('Luna'), method: 'GET', url: `/api/players/${playerId}/stats` })).json()
    expect(stats.achievements).toBe(2)
  })
})

describe('POST /api/players/:id/items', () => {
  const earn = async (games: number) => {
    for (let i = 0; i < games; i++) await postGame(ballSortGame(playerId, { bitsEarned: 5 }))
  }

  it('compra un artículo con los Bits del jugador', async () => {
    await earn(6)
    const res = await buy('color-mint')
    expect(res.statusCode).toBe(201)
    expect(res.json()).toEqual({ status: 'created', itemId: 'color-mint', bits: 0 })
    expect((await profile()).items).toEqual(['color-mint'])
  })

  it('comprar otra vez el mismo artículo no cobra de nuevo', async () => {
    await earn(8)
    await buy('color-mint')
    const retry = await buy('color-mint')
    expect(retry.statusCode).toBe(200)
    expect(retry.json()).toMatchObject({ status: 'duplicate', bits: 10 })
  })

  it('responde 409 si no alcanzan los Bits y no registra la compra', async () => {
    await earn(1)
    const res = await buy('accessory-crown')
    expect(res.statusCode).toBe(409)
    expect(res.json().error).toBe('insufficient-bits')
    expect(await profile()).toMatchObject({ items: [], progress: { bits: 5 } })
  })

  it('rechaza artículos desconocidos', async () => {
    const res = await buy('espada-laser')
    expect(res.statusCode).toBe(400)
  })
})
