import { useEffect, useState } from 'react'
import { CATEGORIES, BITBOT_DIFFICULTIES } from '../../data/categories'
import { CONTENT } from '../../data/content'
import { bitbotBodyColor, DEFAULT_BITBOT } from '../../data/cosmetics'
import { playSfx } from '../../services/audio'
import { useActivePlayer } from '../../stores/playerStore'
import type { GameProps } from '../types'
import { BitBotRobot } from './BitBotRobot'
import type { BitBotConfig } from './config'
import {
  assembledPieces,
  attemptsLeft,
  correctLetters,
  createBitBotGame,
  errorCount,
  getBitBotStatus,
  guessLetter,
  KEYBOARD_ROWS,
  MAX_ERRORS,
  maskedWord,
  normalizeLetter,
  pickWord,
  recentWordsToAvoid,
  wrongLetters,
} from './logic'
import { getRecent, rememberRecent } from '../../utils/recent'

export function BitBotGame({ config, paused, onFinish }: GameProps<BitBotConfig>) {
  const [entry] = useState(() => {
    // Las palabras de las últimas partidas se evitan para que no se repitan tan seguido
    const words = CONTENT[config.category].words
    const list = `bitbot:${config.category}`
    const chosen = pickWord(words, getRecent(list))
    rememberRecent(list, [chosen.word], recentWordsToAvoid(words.length))
    return chosen
  })
  const [state, setState] = useState(() => createBitBotGame(entry.word))
  const look = useActivePlayer()?.bitbot ?? DEFAULT_BITBOT
  const status = getBitBotStatus(state)
  const category = CATEGORIES.find((c) => c.id === config.category)!
  const difficultyName = BITBOT_DIFFICULTIES.find((d) => d.id === config.difficulty)!.name

  function guess(letter: string) {
    const next = guessLetter(state, letter)
    if (next === state) return
    setState(next)

    const end = getBitBotStatus(next)
    if (end === 'playing') {
      playSfx(errorCount(next) > errorCount(state) ? 'wrong' : 'correct')
      return
    }
    const errors = errorCount(next)
    onFinish({
      result: end === 'won' ? 'win' : 'loss',
      summary: `${category.name} · ${entry.word} · ${errors} de ${MAX_ERRORS} errores`,
      stats: [
        { label: 'Palabra', value: entry.word },
        { label: 'Errores', value: `${errors} de ${MAX_ERRORS}` },
      ],
      message: end === 'won' ? '¡BitBot está completo!' : `La palabra era ${entry.word}.`,
      details: {
        category: config.category,
        difficulty: config.difficulty,
        word: entry.word,
        correctLetters: correctLetters(next),
        wrongLetters: wrongLetters(next),
        attemptsUsed: next.guessed.length,
        errors,
      },
    })
  }

  // Teclado físico
  useEffect(() => {
    if (paused || status !== 'playing') return
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return
      const letter = normalizeLetter(e.key)
      if (KEYBOARD_ROWS.some((row) => row.includes(letter))) guess(letter)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const wrong = new Set(wrongLetters(state))
  const right = new Set(correctLetters(state))
  const masked = maskedWord(state)
  const left = attemptsLeft(state)

  return (
    <div className="bitbot">
      <div className="bitbot__top">
        <BitBotRobot assembled={assembledPieces(state)} celebrating={status === 'won'} color={bitbotBodyColor(look.color)} />
        <div className="bitbot__info">
          <span className="pill pill--blue">
            <span aria-hidden>{category.emoji}</span> {category.name} · {difficultyName}
          </span>
          <p className="bitbot__hint">
            <strong>Pista:</strong> {entry.hint}
          </p>
          <div className="bitbot__attempts" aria-label={`Te quedan ${left} de ${MAX_ERRORS} intentos`}>
            <span>Intentos</span>
            <span className="bitbot__hearts" aria-hidden>
              {Array.from({ length: MAX_ERRORS }, (_, i) => (
                <span key={i} className={i < left ? 'is-full' : ''}>
                  {i < left ? '♥' : '♡'}
                </span>
              ))}
            </span>
          </div>
        </div>
      </div>

      <p className="game-status" role="status">
        {status === 'won' && '¡Adivinaste la palabra! BitBot está listo.'}
        {status === 'lost' && `¡Se acabaron los intentos! La palabra era ${state.word}.`}
        {status === 'playing' && `${masked.filter((c) => c === null).length} letras por descubrir`}
      </p>

      <div className="bitbot__word" aria-label={`Palabra: ${masked.map((c) => c ?? 'espacio vacío').join(', ')}`}>
        {[...state.word].map((char, i) => {
          const shown = masked[i]
          return (
            <span
              key={i}
              className={`bitbot__slot ${shown ? 'is-shown' : ''} ${status === 'lost' && !shown ? 'is-revealed' : ''}`}
              aria-hidden
            >
              {shown ?? (status === 'lost' ? char : '')}
            </span>
          )
        })}
      </div>

      <div className="keyboard" role="group" aria-label="Teclado">
        {KEYBOARD_ROWS.map((row) => (
          <div key={row} className="keyboard__row">
            {[...row].map((letter) => {
              const keyState = right.has(letter) ? 'right' : wrong.has(letter) ? 'wrong' : undefined
              return (
                <button
                  key={letter}
                  type="button"
                  className="keyboard__key"
                  data-state={keyState}
                  disabled={keyState !== undefined || status !== 'playing'}
                  aria-label={keyState ? `${letter}, ${keyState === 'right' ? 'correcta' : 'incorrecta'}` : letter}
                  onClick={() => guess(letter)}
                >
                  {letter}
                  {keyState && (
                    <span className="keyboard__mark" aria-hidden>
                      {keyState === 'right' ? '✓' : '✗'}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
