import { useEffect, useState, type CSSProperties } from 'react'
import { PixelGlyph } from '../../components/PixelGlyph'
import { PixelIcon } from '../../components/PixelIcon'
import { CATEGORIES, MEMORY_DIFFICULTIES } from '../../data/categories'
import { CONTENT } from '../../data/content'
import { useHistoryStore } from '../../stores/historyStore'
import { useActivePlayer } from '../../stores/playerStore'
import { playSfx } from '../../services/audio'
import type { GameProps } from '../types'
import type { MemoryConfig } from './config'
import {
  createDeck,
  createMemoryGame,
  flipCard,
  hideUnmatched,
  isFaceUp,
  isLocked,
  isMemoryComplete,
  pairCount,
} from './logic'
import { getRecent, rememberRecent } from '../../utils/recent'

const HIDE_DELAY_MS = 1000

/** Menor número de intentos con el que el jugador completó esta dificultad */
function useBestAttempts(difficulty: string): number | null {
  const player = useActivePlayer()
  const records = useHistoryStore((s) => s.records)
  const attempts = records
    .filter((r) => r.playerId === player?.id && r.game === 'memory' && r.details?.difficulty === difficulty)
    .map((r) => r.details?.attempts)
    .filter((a): a is number => typeof a === 'number')
  return attempts.length > 0 ? Math.min(...attempts) : null
}

export function MemoryGame({ config, onFinish }: GameProps<MemoryConfig>) {
  const difficulty = MEMORY_DIFFICULTIES.find((d) => d.id === config.difficulty)!
  const category = CATEGORIES.find((c) => c.id === config.category)!
  const [state, setState] = useState(() => {
    // Las imágenes de las últimas partidas se dejan al final para que no se repitan tan seguido
    const images = CONTENT[config.category].images
    const pairs = (difficulty.cols * difficulty.rows) / 2
    const list = `memory:${config.category}`
    const cards = createDeck(images, pairs, Math.random, getRecent(list))
    rememberRecent(
      list,
      cards.map((card) => card.image.emoji),
      images.length - pairs,
    )
    return createMemoryGame(cards)
  })
  const best = useBestAttempts(config.difficulty)
  const pairs = pairCount(state)
  const complete = isMemoryComplete(state)

  // Las cartas que no coinciden se ocultan después de un momento
  const locked = isLocked(state)
  useEffect(() => {
    if (!locked) return
    const id = window.setTimeout(() => setState(hideUnmatched), HIDE_DELAY_MS)
    return () => window.clearTimeout(id)
  }, [locked])

  function flip(index: number) {
    const next = flipCard(state, index)
    if (next === state) return
    setState(next)
    if (next.matched.size > state.matched.size) playSfx('match')
    else if (isLocked(next)) playSfx('wrong', 250)
    else playSfx('flip')
    if (!isMemoryComplete(next)) return
    onFinish({
      result: 'completed',
      summary: `${category.name} · ${difficulty.name} · ${next.attempts} intentos`,
      stats: [
        { label: 'Intentos', value: next.attempts },
        { label: 'Parejas', value: pairs },
      ],
      message:
        best === null || next.attempts < best ? '¡Nuevo récord de intentos!' : `Tu récord es de ${best} intentos.`,
      details: {
        category: config.category,
        difficulty: config.difficulty,
        pairs,
        attempts: next.attempts,
      },
    })
  }

  const lastFlipped = state.flipped.at(-1)
  let statusText = 'Voltea dos cartas para buscar una pareja'
  if (complete) statusText = '¡Encontraste todas las parejas!'
  else if (locked) statusText = 'No son iguales. ¡Recuerda dónde están!'
  else if (lastFlipped !== undefined) statusText = `Volteaste: ${state.cards[lastFlipped].image.name}. Busca su pareja.`

  return (
    <div className="memory">
      <div className="game-toolbar">
        <span className="pill pill--blue">
          <PixelIcon emoji={category.emoji} size={16} /> {category.name} · {difficulty.name}
        </span>
        <span className="pill pill--mint">
          Parejas: {state.matched.size} / {pairs}
        </span>
        <span className="pill pill--yellow">Intentos: {state.attempts}</span>
        {best !== null && <span className="pill pill--orange">Récord: {best}</span>}
      </div>

      <p className="game-status" role="status">
        {statusText}
      </p>

      <div className="memory__grid" style={{ '--cols': difficulty.cols } as CSSProperties}>
        {state.cards.map((card, i) => {
          const faceUp = isFaceUp(state, i)
          const matched = state.matched.has(card.pairId)
          return (
            <button
              key={card.id}
              type="button"
              className="memory-card"
              data-face-up={faceUp}
              data-matched={matched}
              aria-label={faceUp ? `${card.image.name}${matched ? ', pareja encontrada' : ''}` : `Carta ${i + 1}, boca abajo`}
              disabled={matched || complete}
              onClick={() => flip(i)}
            >
              <span className="memory-card__inner" aria-hidden>
                <span className="memory-card__back">
                  <PixelGlyph name="star" />
                </span>
                <span className="memory-card__front">
                  <PixelIcon emoji={card.image.emoji} size="62%" />
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
