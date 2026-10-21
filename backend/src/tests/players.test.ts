import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { ballSortGame, bitbotGame, connectFourGame, auth, createTestApp, memoryGame, newToken, tokenFor } from './helpers.js'

let ctx: Awaited<ReturnType<typeof createTestApp>>
beforeAll(async () => {
  ctx = await createTestApp()
})
beforeEach(() => ctx.reset())
afterAll(() => ctx.close())

const createPlayer = (body: { username: string; token?: string } & Record<string, unknown>) =>
  ctx.app.inject({ method: 'POST', url: '/api/players', payload: { token: tokenFor(body.username), ...body } })

describe('POST /api/players', () => {
  it('crea un jugador con identificador propio', async () => {
    const res = await createPlayer({ username: 'Luna', avatar: 'cat' })
    expect(res.statusCode).toBe(201)
    const player = res.json()
    expect(player).toMatchObject({ username: 'Luna', avatar: 'cat' })
    expect(player.id).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('no permite nombres duplicados sin distinguir mayúsculas (sección 16.1)', async () => {
    await createPlayer({ username: 'Jugador01', avatar: 'cat' })
    const res = await createPlayer({ username: 'jugador01', avatar: 'robot' })
    expect(res.statusCode).toBe(409)
    expect(res.json()).toMatchObject({ error: 'username-taken' })
  })

  it('acepta el id del navegador y los reintentos no crean duplicados', async () => {
    const id = randomUUID()
    const first = await createPlayer({ id, username: 'Sol', avatar: 'dino' })
    const retry = await createPlayer({ id, username: 'SOL', avatar: 'dino' })
    expect(first.statusCode).toBe(201)
    expect(retry.statusCode).toBe(200)
    expect(retry.json()).toMatchObject({ id, username: 'Sol' })
  })

  it('con el id de un perfil protegido, otro dispositivo no puede reclamarlo', async () => {
    const id = randomUUID()
    await createPlayer({ id, username: 'Sol', avatar: 'dino' })
    const res = await createPlayer({ id, username: 'Sol', avatar: 'dino', token: newToken() })
    expect(res.statusCode).toBe(409)
    expect(res.json().error).toBe('profile-claimed')
  })

  it('un perfil anterior a la autenticación lo reclama el primer dispositivo que lo registra', async () => {
    const id = randomUUID()
    await createPlayer({ id, username: 'Sol', avatar: 'dino' })
    await ctx.db.query('DELETE FROM player_tokens WHERE player_id = $1', [id])
    const token = newToken()
    expect((await createPlayer({ id, username: 'Sol', avatar: 'dino', token })).statusCode).toBe(200)
    expect((await ctx.app.inject({ method: 'GET', url: `/api/players/${id}`, headers: auth(token) })).statusCode).toBe(200)
    expect((await createPlayer({ id, username: 'Sol', avatar: 'dino', token: newToken() })).statusCode).toBe(409)
  })

  it('el servidor guarda la huella del token, no el token', async () => {
    const { id } = (await createPlayer({ username: 'Luna', avatar: 'cat' })).json()
    const { rows } = await ctx.db.query<{ token_hash: string }>('SELECT token_hash FROM player_tokens WHERE player_id = $1', [id])
    expect(rows).toHaveLength(1)
    expect(rows[0].token_hash).not.toBe(tokenFor('Luna'))
    expect(rows[0].token_hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('rechaza un id que ya pertenece a otro jugador', async () => {
    const id = randomUUID()
    await createPlayer({ id, username: 'Sol', avatar: 'dino' })
    const res = await createPlayer({ id, username: 'Mar', avatar: 'dino' })
    expect(res.statusCode).toBe(409)
    expect(res.json().error).toBe('id-taken')
  })

  it.each([
    [{ username: 'ab', avatar: 'cat' }, 'nombre corto'],
    [{ username: 'con espacio', avatar: 'cat' }, 'espacios'],
    [{ username: 'Luna', avatar: 'dragón' }, 'avatar inexistente'],
    [{ id: 'no-es-uuid', username: 'Luna', avatar: 'cat' }, 'id inválido'],
    [{ username: 'Luna', avatar: 'cat', token: 'corto' }, 'token inválido'],
  ])('valida los datos: %j (%s)', async (body) => {
    const res = await createPlayer(body)
    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('validation-error')
  })

  it('responde 400 ante un JSON mal formado', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/players',
      headers: { 'content-type': 'application/json' },
      payload: '{"username":',
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('consultas de jugador', () => {
  it('GET /api/players/:id devuelve el perfil con su progreso', async () => {
    const { id } = (await createPlayer({ username: 'Luna', avatar: 'cat' })).json()
    const res = await ctx.app.inject({ headers: auth('Luna'), method: 'GET', url: `/api/players/${id}` })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ id, username: 'Luna', progress: { xp: 0, level: 1, bits: 0, xpForNextLevel: 100 } })
  })

  it('exige el token del jugador y responde 400 para un id inválido', async () => {
    const { id } = (await createPlayer({ username: 'Luna', avatar: 'cat' })).json()
    await createPlayer({ username: 'Sol', avatar: 'dino' })
    const get = (url: string, headers = {}) => ctx.app.inject({ method: 'GET', url, headers })
    expect((await get(`/api/players/${id}`)).statusCode).toBe(401)
    expect((await get(`/api/players/${id}/stats`, auth('Sol'))).statusCode).toBe(403)
    expect((await get(`/api/players/${randomUUID()}`, auth('Luna'))).statusCode).toBe(403)
    expect((await get('/api/players/123/history', auth('Luna'))).statusCode).toBe(400)
  })

  it('historial paginado, del más reciente al más antiguo, con los detalles', async () => {
    const { id } = (await createPlayer({ username: 'Luna', avatar: 'cat' })).json()
    const day = (d: number) => new Date(Date.UTC(2026, 9, d)).toISOString()
    for (const [i, game] of [connectFourGame, bitbotGame, ballSortGame].entries()) {
      await ctx.app.inject({ headers: auth('Luna'), method: 'POST', url: '/api/games', payload: game(id, { playedAt: day(i + 1) }) })
    }
    const res = await ctx.app.inject({ headers: auth('Luna'), method: 'GET', url: `/api/players/${id}/history?limit=2` })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.total).toBe(3)
    expect(body.games.map((g: { game: string }) => g.game)).toEqual(['ball-sort', 'bitbot'])
    expect(body.games[0].details).toEqual({ colors: 4, moves: 30, completed: true })

    const page2 = (await ctx.app.inject({ headers: auth('Luna'), method: 'GET', url: `/api/players/${id}/history?limit=2&offset=2` })).json()
    expect(page2.games.map((g: { game: string }) => g.game)).toEqual(['connect-four'])
  })

  it('estadísticas acumuladas por juego', async () => {
    const { id } = (await createPlayer({ username: 'Luna', avatar: 'cat' })).json()
    const games = [
      connectFourGame(id),
      connectFourGame(id, { result: 'loss', xpEarned: 10, details: { ...connectFourGame(id).details, winner: 'BitBot' } }),
      bitbotGame(id),
      ballSortGame(id),
      ballSortGame(id),
      memoryGame(id),
    ]
    await ctx.app.inject({ headers: auth('Luna'), method: 'POST', url: '/api/games/sync', payload: { games } })
    const stats = (await ctx.app.inject({ headers: auth('Luna'), method: 'GET', url: `/api/players/${id}/stats` })).json()
    expect(stats).toMatchObject({
      gamesPlayed: 6,
      wins: 2,
      levelsCompleted: 2,
      achievements: 4, // primera partida, primera victoria, cinco partidas y una victoria en cada juego
      xp: 25 + 10 + 20 + 25 + 25 + 20,
      level: 2,
      byGame: {
        'connect-four': { played: 2, wins: 1, completed: 0 },
        bitbot: { played: 1, wins: 1, completed: 0 },
        'ball-sort': { played: 2, wins: 0, completed: 2 },
        memory: { played: 1, wins: 0, completed: 1 },
      },
    })
  })
})
