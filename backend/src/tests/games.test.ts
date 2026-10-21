import { randomUUID } from 'node:crypto'
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
const sync = (games: unknown[]) =>
  ctx.app.inject({ headers: auth('Luna'), method: 'POST', url: '/api/games/sync', payload: { games } })
const progress = async () =>
  (await ctx.app.inject({ headers: auth('Luna'), method: 'GET', url: `/api/players/${playerId}` })).json().progress

describe('POST /api/games', () => {
  it.each([
    ['Conecta 4', connectFourGame],
    ['Arma a BitBot', bitbotGame],
    ['Ordenamiento de esferas', ballSortGame],
    ['Memorama', memoryGame],
  ])('registra una partida de %s y suma su experiencia', async (_name, factory) => {
    const game = factory(playerId)
    const res = await postGame(game)
    expect(res.statusCode).toBe(201)
    expect(res.json()).toEqual({ id: game.id, status: 'created' })
    expect((await progress()).xp).toBe(game.xpEarned)
  })

  it('reenviar la misma partida no la duplica ni suma XP otra vez (sección 16.1)', async () => {
    const game = bitbotGame(playerId)
    await postGame(game)
    const retry = await postGame(game)
    expect(retry.statusCode).toBe(200)
    expect(retry.json().status).toBe('duplicate')
    const history = (await ctx.app.inject({ headers: auth('Luna'), method: 'GET', url: `/api/players/${playerId}/history` })).json()
    expect(history.total).toBe(1)
    expect((await progress()).xp).toBe(20)
  })

  it('sube de nivel al acumular experiencia', async () => {
    for (let i = 0; i < 4; i++) await postGame(connectFourGame(playerId))
    expect(await progress()).toMatchObject({ xp: 100, level: 2 })
  })

  it('rechaza reutilizar el id de la partida de otro jugador', async () => {
    const other = (
      await ctx.app.inject({
        method: 'POST',
        url: '/api/players',
        payload: { username: 'Sol', avatar: 'dino', token: tokenFor('Sol') },
      })
    ).json().id
    const game = memoryGame(playerId)
    await postGame(game)
    const res = await ctx.app.inject({
      headers: auth('Sol'),
      method: 'POST',
      url: '/api/games',
      payload: { ...game, playerId: other },
    })
    expect(res.statusCode).toBe(409)
    expect(res.json().error).toBe('id-conflict')
  })
})

describe('autenticación (sección 4.3)', () => {
  it('sin token o con un token desconocido responde 401', async () => {
    const game = memoryGame(playerId)
    const missing = await ctx.app.inject({ method: 'POST', url: '/api/games', payload: game })
    const unknown = await ctx.app.inject({ headers: auth('Nadie'), method: 'POST', url: '/api/games', payload: game })
    const malformed = await ctx.app.inject({
      headers: { authorization: 'Bearer abc' },
      method: 'POST',
      url: '/api/games/sync',
      payload: { games: [game] },
    })
    expect([missing.statusCode, unknown.statusCode, malformed.statusCode]).toEqual([401, 401, 401])
    expect(missing.json().error).toBe('unauthorized')
    expect((await progress()).xp).toBe(0)
  })

  it('no se pueden enviar partidas a nombre de otro jugador', async () => {
    const res = await postGame(memoryGame(randomUUID()))
    expect(res.statusCode).toBe(403)
    expect(res.json().error).toBe('forbidden')

    const { results } = (await sync([memoryGame(randomUUID()), memoryGame(playerId)])).json()
    expect(results.map((r: { status: string }) => r.status)).toEqual(['rejected', 'created'])
    expect(results[0].error.code).toBe('forbidden')
  })
})

describe('validación de partidas (sección 13.2)', () => {
  const cases: [string, () => object][] = [
    ['experiencia inflada', () => memoryGame(playerId, { xpEarned: 500 })],
    ['resultado imposible para el juego', () => ballSortGame(playerId, { result: 'win' })],
    ['juego desconocido', () => memoryGame(playerId, { game: 'ajedrez' })],
    ['fecha en el futuro', () => memoryGame(playerId, { playedAt: new Date(Date.now() + 86_400_000).toISOString() })],
    ['duración negativa', () => memoryGame(playerId, { durationMs: -1 })],
    ['id que no es UUID', () => memoryGame(playerId, { id: 'partida-1' })],
    [
      'parejas que no corresponden a la dificultad',
      () => memoryGame(playerId, { details: { category: 'fruits', difficulty: 'expert', pairs: 4, attempts: 6 } }),
    ],
    [
      'menos intentos que parejas',
      () => memoryGame(playerId, { details: { category: 'fruits', difficulty: 'easy', pairs: 4, attempts: 2 } }),
    ],
    [
      'derrota en BitBot sin agotar intentos',
      () => bitbotGame(playerId, { result: 'loss', xpEarned: 10 }),
    ],
    [
      'empate de Conecta 4 sin tablero lleno',
      () =>
        connectFourGame(playerId, {
          result: 'draw',
          xpEarned: 10,
          details: { players: ['Luna', 'BitBot'], mode: 'ai', difficulty: 'normal', moves: 20, winner: null },
        }),
    ],
    [
      'dificultad en una partida local',
      () =>
        connectFourGame(playerId, {
          details: { players: ['Luna', 'Jugador 2'], mode: 'local', difficulty: 'hard', moves: 13, winner: 'Luna' },
        }),
    ],
    ['más de diez colores', () => ballSortGame(playerId, { details: { colors: 11, moves: 80, completed: true } })],
  ]

  it.each(cases)('rechaza: %s', async (_name, build) => {
    const res = await postGame(build())
    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('validation-error')
    expect((await progress()).xp).toBe(0)
  })

  it('acepta un empate válido y una derrota válida', async () => {
    const draw = connectFourGame(playerId, {
      result: 'draw',
      xpEarned: 10,
      details: { players: ['Luna', 'Jugador 2'], mode: 'local', difficulty: null, moves: 42, winner: null },
    })
    const loss = bitbotGame(playerId, {
      result: 'loss',
      xpEarned: 10,
      details: {
        category: 'animals',
        difficulty: 'easy',
        word: 'GATO',
        correctLetters: ['A'],
        wrongLetters: ['B', 'C', 'D', 'E', 'F'],
        attemptsUsed: 6,
        errors: 5,
      },
    })
    expect((await postGame(draw)).statusCode).toBe(201)
    expect((await postGame(loss)).statusCode).toBe(201)
  })
})

describe('POST /api/games/sync', () => {
  it('confirma cuáles partidas se guardaron, cuáles ya existían y cuáles se rechazaron', async () => {
    const saved = ballSortGame(playerId)
    await postGame(saved)
    const fresh = memoryGame(playerId)
    const invalid = memoryGame(playerId, { xpEarned: 999 })

    const res = await sync([saved, fresh, invalid, 'basura'])
    expect(res.statusCode).toBe(200)
    const { results } = res.json()
    expect(results.map((r: { status: string }) => r.status)).toEqual(['duplicate', 'created', 'rejected', 'rejected'])
    expect(results[0].id).toBe(saved.id)
    expect(results[2]).toMatchObject({ id: invalid.id, error: { code: 'validation-error' } })
    expect(results[3].id).toBeNull()
    expect((await progress()).xp).toBe(25 + 20)
  })

  it('reintentar el mismo lote es idempotente', async () => {
    const games = [connectFourGame(playerId), bitbotGame(playerId)]
    await sync(games)
    const retry = (await sync(games)).json()
    expect(retry.results.every((r: { status: string }) => r.status === 'duplicate')).toBe(true)
    expect((await progress()).xp).toBe(45)
  })

  it('valida el tamaño del lote', async () => {
    expect((await sync([])).statusCode).toBe(400)
    expect((await sync(Array.from({ length: 101 }, () => memoryGame(playerId)))).statusCode).toBe(400)
  })
})
