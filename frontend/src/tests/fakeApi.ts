// Servidor falso para las pruebas: imita las respuestas de la API real (backend/src/routes)
import type { GameRecord } from '../types'
import { findCosmetic } from '../data/cosmetics'
import { bitsForGame, xpForGame } from '../utils/rewards'
import { normalizeUsername } from '../utils/username'

interface FakePlayer {
  id: string
  username: string
  avatar: string
}

export const fakeApi = {
  players: new Map<string, FakePlayer>(),
  games: new Map<string, Omit<GameRecord, 'syncStatus'>>(),
  /** Compras por jugador y Bits gastados */
  items: new Map<string, Set<string>>(),
  spent: new Map<string, number>(),
  /** Código secreto de cada jugador */
  codes: new Map<string, string>(),
  /** Tokens autorizados de cada jugador */
  tokens: new Map<string, Set<string>>(),
  offline: false,
  requests: [] as { method: string; path: string; body: unknown; token?: string }[],
  reset() {
    this.players.clear()
    this.games.clear()
    this.items.clear()
    this.spent.clear()
    this.codes.clear()
    this.tokens.clear()
    this.offline = false
    this.requests = []
  },
}

const json = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })

const unauthorized = () => json(401, { error: 'unauthorized', message: 'Este dispositivo no tiene permiso.' })
const forbidden = () => json(403, { error: 'forbidden', message: 'No puedes modificar los datos de otro jugador.' })

function addToken(playerId: string, token: string) {
  fakeApi.tokens.set(playerId, (fakeApi.tokens.get(playerId) ?? new Set()).add(token))
}

/** Jugador dueño del token de la solicitud */
function ownerOf(init?: RequestInit): string | null {
  const header = (init?.headers as Record<string, string> | undefined)?.Authorization
  const token = header?.replace(/^Bearer /, '')
  if (!token) return null
  return [...fakeApi.tokens].find(([, tokens]) => tokens.has(token))?.[0] ?? null
}

function createPlayer(body: { id?: string; username: string; avatar: string; token: string }) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(body.token ?? '')) {
    return json(400, { error: 'validation-error', message: 'El token del dispositivo no es válido.' })
  }
  const normalized = normalizeUsername(body.username)
  const sameName = [...fakeApi.players.values()].find((p) => normalizeUsername(p.username) === normalized)
  if (sameName && sameName.id === body.id) {
    const tokens = fakeApi.tokens.get(sameName.id)
    if (tokens?.size && !tokens.has(body.token)) {
      return json(409, { error: 'profile-claimed', message: 'Este perfil ya está protegido.' })
    }
    addToken(sameName.id, body.token)
    return json(200, sameName)
  }
  if (sameName) return json(409, { error: 'username-taken', message: 'Ese nombre ya está en uso.' })
  if (body.id && fakeApi.players.has(body.id)) return json(409, { error: 'id-taken', message: 'Id en uso.' })
  const player = { id: body.id ?? crypto.randomUUID(), username: body.username, avatar: body.avatar }
  fakeApi.players.set(player.id, player)
  addToken(player.id, body.token)
  const recoveryCode = `C0DE-${fakeApi.players.size.toString().padStart(4, '0')}`
  fakeApi.codes.set(player.id, recoveryCode)
  return json(201, { ...player, recoveryCode })
}

function saveGame(game: Omit<GameRecord, 'syncStatus'>, owner: string) {
  if (game.playerId !== owner) {
    return { id: game.id, status: 'rejected', error: { code: 'forbidden', message: 'Partida de otro jugador.' } }
  }
  if (!fakeApi.players.has(game.playerId)) {
    return { id: game.id, status: 'rejected', error: { code: 'not-found', message: 'No existe el jugador.' } }
  }
  if (fakeApi.games.has(game.id)) return { id: game.id, status: 'duplicate' }
  const bitsOk = game.bitsEarned === undefined || game.bitsEarned === bitsForGame(game.result)
  if (game.xpEarned !== xpForGame(game.game, game.result) || !bitsOk) {
    return { id: game.id, status: 'rejected', error: { code: 'validation-error', message: 'La partida no es válida.' } }
  }
  fakeApi.games.set(game.id, game)
  return { id: game.id, status: 'created' }
}

function bitsOf(playerId: string): number {
  const earned = [...fakeApi.games.values()]
    .filter((g) => g.playerId === playerId)
    .reduce((n, g) => n + (g.bitsEarned ?? 0), 0)
  return earned - (fakeApi.spent.get(playerId) ?? 0)
}

function buyItem(playerId: string, itemId: string) {
  const item = findCosmetic(itemId)
  if (!fakeApi.players.has(playerId)) return json(404, { error: 'not-found', message: 'No existe el jugador.' })
  if (!item) return json(400, { error: 'validation-error', message: 'El artículo no existe.' })
  const owned = fakeApi.items.get(playerId) ?? new Set<string>()
  if (owned.has(itemId)) return json(200, { status: 'duplicate', itemId, bits: bitsOf(playerId) })
  if (bitsOf(playerId) < item.price) {
    return json(409, { error: 'insufficient-bits', message: 'No tienes Bits suficientes para este artículo.' })
  }
  owned.add(itemId)
  fakeApi.items.set(playerId, owned)
  fakeApi.spent.set(playerId, (fakeApi.spent.get(playerId) ?? 0) + item.price)
  return json(201, { status: 'created', itemId, bits: bitsOf(playerId) })
}

const cleanCode = (code: string) => code.toUpperCase().replace(/[\s-]/g, '')

function recover(body: { username: string; code: string; token: string }) {
  const player = [...fakeApi.players.values()].find(
    (p) => normalizeUsername(p.username) === normalizeUsername(body.username),
  )
  const code = player && fakeApi.codes.get(player.id)
  if (!player || !code || cleanCode(code) !== cleanCode(body.code)) {
    return json(401, { error: 'invalid-recovery', message: 'El nombre o el código secreto no son correctos.' })
  }
  addToken(player.id, body.token)
  const games = [...fakeApi.games.values()].filter((g) => g.playerId === player.id)
  return json(200, {
    player: {
      ...player,
      createdAt: '2026-01-01T00:00:00.000Z',
      progress: { xp: games.reduce((n, g) => n + g.xpEarned, 0), bits: bitsOf(player.id) },
      hasRecoveryCode: true,
      achievements: [],
      items: [...(fakeApi.items.get(player.id) ?? [])],
    },
    games: games.map(({ playerId: _p, ...g }) => ({ ...g, details: g.details ?? null })),
  })
}

function createCode(playerId: string) {
  if (!fakeApi.players.has(playerId)) return json(404, { error: 'not-found', message: 'No existe el jugador.' })
  if (fakeApi.codes.has(playerId)) return json(409, { error: 'code-exists', message: 'Este perfil ya tiene un código secreto.' })
  fakeApi.codes.set(playerId, 'NUEV-0C0D')
  return json(201, { recoveryCode: 'NUEV-0C0D' })
}

export async function fakeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (fakeApi.offline) throw new TypeError('Failed to fetch')
  const path = String(input)
  const method = init?.method ?? 'GET'
  const body = init?.body ? JSON.parse(String(init.body)) : undefined
  const token = (init?.headers as Record<string, string> | undefined)?.Authorization?.replace(/^Bearer /, '')
  fakeApi.requests.push({ method, path, body, token })

  if (method === 'POST' && path === '/api/players') return createPlayer(body)
  if (method === 'POST' && path === '/api/players/recover') return recover(body)
  // Las demás rutas exigen el token del jugador
  const owner = ownerOf(init)
  if (method === 'POST' && path === '/api/games/sync') {
    if (!owner) return unauthorized()
    return json(200, { results: body.games.map((g: Omit<GameRecord, 'syncStatus'>) => saveGame(g, owner)) })
  }
  const playerRoute = path.match(/^\/api\/players\/([^/]+)\//)
  if (playerRoute && !owner) return unauthorized()
  if (playerRoute && owner !== playerRoute[1]) return forbidden()
  const code = path.match(/^\/api\/players\/([^/]+)\/recovery-code$/)
  if (method === 'POST' && code) return createCode(code[1])
  const items = path.match(/^\/api\/players\/([^/]+)\/items$/)
  if (method === 'POST' && items) return buyItem(items[1], body.itemId)
  return json(404, { error: 'not-found', message: 'Ruta desconocida' })
}
