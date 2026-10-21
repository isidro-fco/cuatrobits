import { describe, expect, it } from 'vitest'
import { CATEGORIES } from '../data/categories'
import { CONTENT } from '../data/content'
import { parseBitBotConfig } from '../games/bitbot/config'
import {
  assembledPieces,
  attemptsLeft,
  createBitBotGame,
  getBitBotStatus,
  guessLetter,
  INITIAL_PIECES,
  KEYBOARD_ROWS,
  MAX_ERRORS,
  maskedWord,
  normalizeLetter,
  TOTAL_PIECES,
  wrongLetters,
} from '../games/bitbot/logic'

const guessAll = (word: string, letters: string) =>
  [...letters].reduce((state, l) => guessLetter(state, l), createBitBotGame(word))

describe('reglas de Arma a BitBot (sección 16.3)', () => {
  it('empieza con la palabra oculta, tres piezas y cinco intentos', () => {
    const state = createBitBotGame('GATO')
    expect(maskedWord(state)).toEqual([null, null, null, null])
    expect(assembledPieces(state)).toBe(INITIAL_PIECES)
    expect(attemptsLeft(state)).toBe(MAX_ERRORS)
  })

  it('revela todas las apariciones de una letra correcta', () => {
    const state = guessLetter(createBitBotGame('BANANA'), 'A')
    expect(maskedWord(state)).toEqual([null, 'A', null, 'A', null, 'A'])
  })

  it('una letra correcta no consume intentos', () => {
    expect(attemptsLeft(guessLetter(createBitBotGame('GATO'), 'G'))).toBe(MAX_ERRORS)
  })

  it('cada error reduce un intento', () => {
    const state = guessAll('GATO', 'XZ')
    expect(attemptsLeft(state)).toBe(MAX_ERRORS - 2)
    expect(wrongLetters(state)).toEqual(['X', 'Z'])
  })

  it('una letra ya usada no se puede elegir de nuevo', () => {
    const once = guessLetter(createBitBotGame('GATO'), 'X')
    const twice = guessLetter(once, 'X')
    expect(twice).toBe(once)
    expect(attemptsLeft(twice)).toBe(MAX_ERRORS - 1)
  })

  it('gana al completar la palabra y BitBot queda armado', () => {
    const state = guessAll('GATO', 'GATO')
    expect(getBitBotStatus(state)).toBe('won')
    expect(assembledPieces(state)).toBe(TOTAL_PIECES)
  })

  it('pierde al agotar los cinco intentos', () => {
    const state = guessAll('GATO', 'BCDEF')
    expect(getBitBotStatus(state)).toBe('lost')
    expect(attemptsLeft(state)).toBe(0)
  })

  it('no acepta letras después de terminar', () => {
    const lost = guessAll('GATO', 'BCDEF')
    expect(guessLetter(lost, 'G')).toBe(lost)
    const won = guessAll('GATO', 'GATO')
    expect(guessLetter(won, 'X')).toBe(won)
  })

  it('las piezas crecen con los aciertos y no con los errores', () => {
    const word = createBitBotGame('MANZANA')
    const afterError = guessLetter(word, 'X')
    expect(assembledPieces(afterError)).toBe(INITIAL_PIECES)
    const afterHit = guessLetter(afterError, 'A')
    expect(assembledPieces(afterHit)).toBeGreaterThan(INITIAL_PIECES)
    expect(assembledPieces(afterHit)).toBeLessThan(TOTAL_PIECES)
  })
})

describe('normalización de letras (sección 6.2)', () => {
  it('ignora tildes y mayúsculas, pero distingue la Ñ', () => {
    expect(normalizeLetter('á')).toBe('A')
    expect(normalizeLetter('Ü')).toBe('U')
    expect(normalizeLetter('ñ')).toBe('Ñ')
  })

  it('la letra sin tilde revela la letra con tilde', () => {
    const state = guessAll('LÁPIZ', 'A')
    expect(maskedWord(state)).toEqual([null, 'Á', null, null, null])
  })

  it('la Ñ no revela la N', () => {
    const state = guessLetter(createBitBotGame('PIÑA'), 'N')
    expect(maskedWord(state)).toEqual([null, null, null, null])
    expect(attemptsLeft(state)).toBe(MAX_ERRORS - 1)
  })
})

describe('catálogo de palabras', () => {
  const keyboard = new Set(KEYBOARD_ROWS.join(''))

  it('todas las palabras se pueden escribir con el teclado en pantalla y tienen pista', () => {
    for (const { words } of Object.values(CONTENT)) {
      expect(words.length).toBeGreaterThanOrEqual(5)
      for (const { word, hint } of words) {
        expect(hint.length).toBeGreaterThan(0)
        for (const char of word) expect(keyboard.has(normalizeLetter(char))).toBe(true)
      }
    }
  })

  it('solo acepta categorías de la dificultad elegida', () => {
    expect(parseBitBotConfig(new URLSearchParams('categoria=space&dificultad=hard'))).toEqual({
      category: 'space',
      difficulty: 'hard',
    })
    expect(parseBitBotConfig(new URLSearchParams('categoria=space&dificultad=easy'))).toBeNull()
    expect(parseBitBotConfig(new URLSearchParams('categoria=nada&dificultad=easy'))).toBeNull()
    expect(CATEGORIES.every((c) => CONTENT[c.id])).toBe(true)
  })
})
