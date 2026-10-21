import type { GameId } from '../types'

export interface GameInfo {
  id: GameId
  name: string
  tagline: string
  /** Pantalla de preparación a la que lleva la isla del lobby */
  entryPath: string
  /** Color de la etiqueta; con contraste suficiente para texto blanco */
  color: string
  islandColor: string
}

export const GAMES: Record<GameId, GameInfo> = {
  'connect-four': {
    id: 'connect-four',
    name: 'Conecta 4',
    tagline: 'Alinea cuatro fichas',
    entryPath: '/preparar/connect-four',
    color: 'var(--blue)',
    islandColor: 'var(--mint)',
  },
  bitbot: {
    id: 'bitbot',
    name: 'Arma a BitBot',
    tagline: 'Construye y descubre palabras',
    entryPath: '/preparar/bitbot',
    color: '#6d4fd6',
    islandColor: 'var(--lilac)',
  },
  'ball-sort': {
    id: 'ball-sort',
    name: 'Ordenamiento de esferas',
    tagline: 'Ordena los colores',
    entryPath: '/preparar/ball-sort',
    color: '#147a58',
    islandColor: 'var(--mint)',
  },
  memory: {
    id: 'memory',
    name: 'Memorama',
    tagline: 'Encuentra todas las parejas',
    entryPath: '/preparar/memory',
    color: '#c4520f',
    islandColor: 'var(--orange)',
  },
}

export const GAME_ORDER: GameId[] = ['connect-four', 'bitbot', 'ball-sort', 'memory']

export function isGameId(value: string | undefined): value is GameId {
  return value !== undefined && value in GAMES
}
