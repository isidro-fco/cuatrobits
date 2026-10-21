// Reglas de Memorama (sección 8.4). Funciones puras.
import type { ImageEntry } from '../../data/content'

export interface MemoryCard {
  /** Posición única de la carta en el tablero */
  id: number
  /** Las dos cartas de una pareja comparten `pairId` */
  pairId: number
  image: ImageEntry
}

export interface MemoryState {
  cards: MemoryCard[]
  /** Índices de las cartas boca arriba que aún no forman pareja (máximo dos) */
  flipped: number[]
  matched: Set<number>
  /** Turnos completos: cada vez que se voltean dos cartas */
  attempts: number
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = items.slice()
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Selecciona las imágenes, duplica cada una y mezcla las cartas */
export function createDeck(images: ImageEntry[], pairs: number, random: () => number = Math.random): MemoryCard[] {
  if (images.length < pairs) throw new Error(`Se necesitan ${pairs} imágenes y solo hay ${images.length}`)
  const chosen = shuffle(images, random).slice(0, pairs)
  const cards = chosen.flatMap((image, pairId) => [
    { pairId, image },
    { pairId, image },
  ])
  return shuffle(cards, random).map((card, id) => ({ ...card, id }))
}

export function createMemoryGame(cards: MemoryCard[]): MemoryState {
  return { cards, flipped: [], matched: new Set(), attempts: 0 }
}

/** Hay dos cartas distintas boca arriba esperando a ocultarse */
export function isLocked(state: MemoryState): boolean {
  return state.flipped.length === 2
}

export function isFaceUp(state: MemoryState, index: number): boolean {
  return state.flipped.includes(index) || state.matched.has(state.cards[index].pairId)
}

/**
 * Voltea una carta. Si es la segunda del turno, cuenta un intento y, si coincide, la pareja
 * queda visible. Si no coinciden, ambas siguen boca arriba hasta llamar a `hideUnmatched`.
 */
export function flipCard(state: MemoryState, index: number): MemoryState {
  if (isLocked(state) || index < 0 || index >= state.cards.length || isFaceUp(state, index)) return state
  const flipped = [...state.flipped, index]
  if (flipped.length < 2) return { ...state, flipped }

  const [a, b] = flipped.map((i) => state.cards[i])
  const attempts = state.attempts + 1
  if (a.pairId === b.pairId) {
    return { ...state, flipped: [], matched: new Set(state.matched).add(a.pairId), attempts }
  }
  return { ...state, flipped, attempts }
}

export function hideUnmatched(state: MemoryState): MemoryState {
  return isLocked(state) ? { ...state, flipped: [] } : state
}

export function pairCount(state: MemoryState): number {
  return state.cards.length / 2
}

export function isMemoryComplete(state: MemoryState): boolean {
  return state.matched.size === pairCount(state)
}
