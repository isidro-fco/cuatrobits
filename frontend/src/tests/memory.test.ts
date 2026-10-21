import { describe, expect, it } from 'vitest'
import { CATEGORIES, MEMORY_DIFFICULTIES } from '../data/categories'
import { CONTENT } from '../data/content'
import { parseMemoryConfig } from '../games/memory/config'
import {
  createDeck,
  createMemoryGame,
  flipCard,
  hideUnmatched,
  isFaceUp,
  isMemoryComplete,
  type MemoryCard,
  type MemoryState,
} from '../games/memory/logic'

const images = CONTENT.animals.images

/** Índices de las dos cartas de cada pareja */
function pairsOf(cards: MemoryCard[]): [number, number][] {
  const byPair = new Map<number, number[]>()
  cards.forEach((c, i) => byPair.set(c.pairId, [...(byPair.get(c.pairId) ?? []), i]))
  return [...byPair.values()] as [number, number][]
}

function mismatch(state: MemoryState): [number, number] {
  const [[a], [b]] = pairsOf(state.cards)
  return [a, b]
}

describe('mazo de Memorama (sección 16.5)', () => {
  it.each(MEMORY_DIFFICULTIES)('en $name cada carta tiene exactamente una pareja', ({ cols, rows }) => {
    const pairs = (cols * rows) / 2
    const cards = createDeck(images, pairs)
    expect(cards).toHaveLength(cols * rows)
    const groups = pairsOf(cards)
    expect(groups).toHaveLength(pairs)
    for (const [a, b] of groups) expect(cards[a].image).toEqual(cards[b].image)
    expect(new Set(groups.map(([a]) => cards[a].image.emoji)).size).toBe(pairs)
  })

  it('usa primero las imágenes que no salieron en las últimas partidas', () => {
    const first = createDeck(images, 8)
    const used = [...new Set(first.map((c) => c.image.emoji))]
    const next = createDeck(images, 8, Math.random, used)
    expect(next.some((c) => used.includes(c.image.emoji))).toBe(false)

    // En Experto no alcanzan las nuevas: se completan con las que salieron hace más tiempo
    const recent = images.map((i) => i.emoji).slice(0, images.length - 4)
    const expert = new Set(createDeck(images, 18, Math.random, recent).map((c) => c.image.emoji))
    for (const emoji of images.map((i) => i.emoji).slice(images.length - 4)) expect(expert).toContain(emoji)
    for (const emoji of recent.slice(-14)) expect(expert).toContain(emoji)
    expect(expert.has(recent[0])).toBe(false)
  })

  it('todas las categorías tienen imágenes suficientes para Experto', () => {
    for (const category of CATEGORIES) {
      const list = CONTENT[category.id].images
      expect(list.length).toBeGreaterThanOrEqual(18)
      expect(new Set(list.map((i) => i.emoji)).size).toBe(list.length)
    }
  })
})

describe('reglas de Memorama (sección 16.5)', () => {
  it('las cartas comienzan boca abajo', () => {
    const state = createMemoryGame(createDeck(images, 4))
    expect(state.cards.every((_, i) => !isFaceUp(state, i))).toBe(true)
  })

  it('no se seleccionan más de dos cartas al mismo tiempo', () => {
    let state = createMemoryGame(createDeck(images, 4))
    const [a, b] = mismatch(state)
    state = flipCard(flipCard(state, a), b)
    const third = state.cards.findIndex((_, i) => i !== a && i !== b)
    expect(flipCard(state, third)).toBe(state)
    expect(state.flipped).toHaveLength(2)
  })

  it('no cuenta dos veces la misma carta', () => {
    const state = flipCard(createMemoryGame(createDeck(images, 4)), 0)
    expect(flipCard(state, 0)).toBe(state)
  })

  it('las parejas encontradas permanecen visibles', () => {
    let state = createMemoryGame(createDeck(images, 4))
    const [a, b] = pairsOf(state.cards)[0]
    state = flipCard(flipCard(state, a), b)
    expect(state.flipped).toHaveLength(0)
    expect(isFaceUp(state, a) && isFaceUp(state, b)).toBe(true)
    expect(flipCard(state, a)).toBe(state)
    state = hideUnmatched(state)
    expect(isFaceUp(state, a)).toBe(true)
  })

  it('las cartas distintas se ocultan y cuentan un intento', () => {
    let state = createMemoryGame(createDeck(images, 4))
    const [a, b] = mismatch(state)
    state = flipCard(flipCard(state, a), b)
    expect(state.attempts).toBe(1)
    state = hideUnmatched(state)
    expect(isFaceUp(state, a) || isFaceUp(state, b)).toBe(false)
  })

  it('termina al encontrar todas las parejas', () => {
    let state = createMemoryGame(createDeck(images, 8))
    const groups = pairsOf(state.cards)
    groups.forEach(([a, b], i) => {
      expect(isMemoryComplete(state)).toBe(false)
      state = flipCard(flipCard(state, a), b)
      expect(state.matched.size).toBe(i + 1)
    })
    expect(isMemoryComplete(state)).toBe(true)
    expect(state.attempts).toBe(8)
  })
})

describe('configuración de Memorama', () => {
  it('valida la categoría y la dificultad', () => {
    expect(parseMemoryConfig(new URLSearchParams('categoria=fruits&dificultad=expert'))).toEqual({
      category: 'fruits',
      difficulty: 'expert',
    })
    expect(parseMemoryConfig(new URLSearchParams('categoria=fruits&dificultad=medium'))).toBeNull()
    expect(parseMemoryConfig(new URLSearchParams('dificultad=easy'))).toBeNull()
  })
})
