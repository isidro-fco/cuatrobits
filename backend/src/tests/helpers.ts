import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { buildApp } from '../app.js'
import { createPgliteDatabase } from '../config/database.js'
import { migrate } from '../config/migrate.js'

/** Aplicación con PostgreSQL en memoria (PGlite) y el esquema real */
export async function createTestApp() {
  const db = createPgliteDatabase()
  await migrate(db)
  const app = buildApp({ db, logger: false })
  return {
    app,
    db,
    async reset() {
      await db.exec('TRUNCATE players, games, game_details, progress, player_achievements, player_items, player_tokens CASCADE')
    },
    async close() {
      await app.close()
      await db.close()
    },
  }
}

/** Token de dispositivo fijo para cada nombre, para no tener que guardarlo en cada prueba */
export function tokenFor(username: string): string {
  return createHash('sha256').update(`prueba:${username.toLowerCase()}`).digest('base64url')
}

/** Token de un dispositivo nuevo */
export const newToken = () => randomBytes(32).toString('base64url')

/** Cabecera de autenticación del dispositivo de ese jugador */
export const auth = (usernameOrToken: string) => ({
  authorization: `Bearer ${usernameOrToken.length === 43 ? usernameOrToken : tokenFor(usernameOrToken)}`,
})

export function connectFourGame(playerId: string, overrides: Record<string, unknown> = {}) {
  return {
    id: randomUUID(),
    playerId,
    game: 'connect-four',
    result: 'win',
    durationMs: 95_000,
    xpEarned: 25,
    summary: 'Contra BitBot (Normal) · 13 movimientos',
    playedAt: new Date().toISOString(),
    details: { players: ['Luna', 'BitBot'], mode: 'ai', difficulty: 'normal', moves: 13, winner: 'Luna' },
    ...overrides,
  }
}

export function bitbotGame(playerId: string, overrides: Record<string, unknown> = {}) {
  return {
    id: randomUUID(),
    playerId,
    game: 'bitbot',
    result: 'win',
    durationMs: 40_000,
    xpEarned: 20,
    summary: 'Animales · GATO · 1 de 5 errores',
    playedAt: new Date().toISOString(),
    details: {
      category: 'animals',
      difficulty: 'easy',
      word: 'GATO',
      correctLetters: ['G', 'A', 'T', 'O'],
      wrongLetters: ['X'],
      attemptsUsed: 5,
      errors: 1,
    },
    ...overrides,
  }
}

export function ballSortGame(playerId: string, overrides: Record<string, unknown> = {}) {
  return {
    id: randomUUID(),
    playerId,
    game: 'ball-sort',
    result: 'completed',
    durationMs: 120_000,
    xpEarned: 25,
    summary: '4 colores · 30 movimientos',
    playedAt: new Date().toISOString(),
    details: { colors: 4, moves: 30, completed: true },
    ...overrides,
  }
}

export function memoryGame(playerId: string, overrides: Record<string, unknown> = {}) {
  return {
    id: randomUUID(),
    playerId,
    game: 'memory',
    result: 'completed',
    durationMs: 60_000,
    xpEarned: 20,
    summary: 'Frutas · Fácil · 6 intentos',
    playedAt: new Date().toISOString(),
    details: { category: 'fruits', difficulty: 'easy', pairs: 4, attempts: 6 },
    ...overrides,
  }
}
