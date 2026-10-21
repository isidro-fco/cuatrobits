// Validación de las solicitudes. El servidor no confía en los datos del navegador (sección 13.2).
import { z } from 'zod'
import { tokenSchema } from './auth.js'
import { ITEM_IDS } from './cosmetics.js'
import { bitsForGame, RESULTS_BY_GAME, xpForGame } from './rules.js'

export const USERNAME_MIN = 3
export const USERNAME_MAX = 15

/** Igual que en el frontend: sin distinguir mayúsculas (sección 4.1) */
export function normalizeUsername(username: string): string {
  return username.trim().normalize('NFC').toLocaleLowerCase('es')
}

export const AVATARS = ['robot', 'cat', 'dino', 'fox', 'astronaut', 'monster'] as const
const CATEGORIES = ['animals', 'colors', 'fruits', 'school', 'transport', 'nature', 'space', 'technology'] as const

export const idSchema = z.uuid({ error: 'El identificador debe ser un UUID.' })

export const createPlayerSchema = z.object({
  /** Opcional: permite registrar con el mismo id un perfil creado antes en el navegador */
  id: idSchema.optional(),
  username: z
    .string()
    .trim()
    .min(USERNAME_MIN, `El nombre debe tener al menos ${USERNAME_MIN} letras.`)
    .max(USERNAME_MAX, `El nombre puede tener hasta ${USERNAME_MAX} letras.`)
    .regex(/^[\p{L}\p{N}_]+$/u, 'Usa solo letras, números o guion bajo.'),
  avatar: z.enum(AVATARS),
  /** Token secreto que este dispositivo enviará en las solicitudes (sección 4.3) */
  token: tokenSchema,
})
export type CreatePlayerInput = z.infer<typeof createPlayerSchema>

export const recoverSchema = z.object({
  username: z.string().trim().min(1).max(USERNAME_MAX),
  code: z.string().trim().min(1).max(20),
  /** Token del dispositivo donde se recupera el perfil */
  token: tokenSchema,
})

export const historyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

const count = z.number().int().min(0)
const MAX_DURATION_MS = 24 * 60 * 60 * 1000
/** Margen para relojes de dispositivos ligeramente adelantados */
const CLOCK_SKEW_MS = 5 * 60 * 1000

const base = {
  id: idSchema,
  playerId: idSchema,
  durationMs: z.number().int().min(0).max(MAX_DURATION_MS),
  xpEarned: count,
  /** Las partidas guardadas antes de la etapa 4 no traen Bits */
  bitsEarned: count.optional(),
  summary: z.string().max(200),
  playedAt: z.iso.datetime({ offset: true }),
}

const connectFour = z.object({
  ...base,
  game: z.literal('connect-four'),
  result: z.enum(['win', 'loss', 'draw']),
  details: z.object({
    players: z.array(z.string().max(30)).length(2),
    mode: z.enum(['ai', 'local']),
    difficulty: z.enum(['easy', 'normal', 'hard']).nullable(),
    moves: z.number().int().min(7).max(42),
    winner: z.string().max(30).nullable(),
  }),
})

const bitbot = z.object({
  ...base,
  game: z.literal('bitbot'),
  result: z.enum(['win', 'loss']),
  details: z.object({
    category: z.enum(CATEGORIES),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    word: z.string().min(1).max(30),
    correctLetters: z.array(z.string().length(1)),
    wrongLetters: z.array(z.string().length(1)).max(5),
    attemptsUsed: count,
    errors: z.number().int().min(0).max(5),
  }),
})

const ballSort = z.object({
  ...base,
  game: z.literal('ball-sort'),
  result: z.literal('completed'),
  details: z.object({
    colors: z.number().int().min(1).max(10),
    moves: z.number().int().min(1),
    completed: z.literal(true),
  }),
})

const MEMORY_PAIRS = { easy: 4, normal: 8, hard: 12, expert: 18 } as const

const memory = z.object({
  ...base,
  game: z.literal('memory'),
  result: z.literal('completed'),
  details: z.object({
    category: z.enum(CATEGORIES),
    difficulty: z.enum(['easy', 'normal', 'hard', 'expert']),
    pairs: z.number().int(),
    attempts: z.number().int(),
  }),
})

/** Partida terminada, con comprobaciones de coherencia entre resultado, estadísticas y XP */
export const gameSchema = z.discriminatedUnion('game', [connectFour, bitbot, ballSort, memory]).superRefine((g, ctx) => {
  const issue = (message: string, path: string[] = ['details']) => ctx.addIssue({ code: 'custom', message, path })

  if (!RESULTS_BY_GAME[g.game].includes(g.result)) issue('Resultado no válido para este juego.', ['result'])
  if (g.xpEarned !== xpForGame(g.game, g.result)) {
    issue(`La experiencia debe ser ${xpForGame(g.game, g.result)}.`, ['xpEarned'])
  }
  if (g.bitsEarned !== undefined && g.bitsEarned !== bitsForGame(g.result)) {
    issue(`Los Bits deben ser ${bitsForGame(g.result)}.`, ['bitsEarned'])
  }
  if (Date.parse(g.playedAt) > Date.now() + CLOCK_SKEW_MS) issue('La fecha no puede estar en el futuro.', ['playedAt'])

  switch (g.game) {
    case 'connect-four': {
      const d = g.details
      if ((d.mode === 'ai') !== (d.difficulty !== null)) issue('Solo las partidas contra la IA tienen dificultad.')
      if (g.result === 'draw' && (d.moves !== 42 || d.winner !== null)) issue('Un empate requiere el tablero lleno.')
      if (g.result !== 'draw' && d.winner === null) issue('Falta el ganador.')
      break
    }
    case 'bitbot': {
      const d = g.details
      if (d.wrongLetters.length !== d.errors) issue('Los errores no coinciden con las letras incorrectas.')
      if (d.attemptsUsed !== d.correctLetters.length + d.wrongLetters.length) issue('Los intentos no coinciden.')
      if (g.result === 'loss' && d.errors !== 5) issue('Una derrota requiere agotar los cinco intentos.')
      if (g.result === 'win' && d.errors >= 5) issue('No se puede ganar sin intentos.')
      break
    }
    case 'memory': {
      const d = g.details
      if (d.pairs !== MEMORY_PAIRS[d.difficulty]) issue('El número de parejas no corresponde a la dificultad.')
      if (d.attempts < d.pairs) issue('Se necesita al menos un intento por pareja.')
      break
    }
  }
})
export type GameInput = z.infer<typeof gameSchema>

export const MAX_SYNC_BATCH = 100

/** Cada partida se valida por separado para poder rechazar solo las incorrectas */
export const syncSchema = z.object({
  games: z.array(z.unknown()).min(1).max(MAX_SYNC_BATCH),
})

export const buyItemSchema = z.object({
  itemId: z.enum(ITEM_IDS, { error: 'El artículo no existe.' }),
})
