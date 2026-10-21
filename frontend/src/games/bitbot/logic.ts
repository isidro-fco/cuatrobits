// Reglas de Arma a BitBot (secciones 6.3 y 6.4). Funciones puras.

export const TOTAL_PIECES = 8
export const INITIAL_PIECES = 3
export const MAX_ERRORS = 5

/** Teclado en pantalla: alfabeto español */
export const KEYBOARD_ROWS = ['QWERTYUIOP', 'ASDFGHJKLÑ', 'ZXCVBNM']

/**
 * Normaliza una letra para compararla: mayúsculas y sin tildes ni diéresis.
 * La Ñ se conserva porque es una letra distinta de la N.
 */
export function normalizeLetter(letter: string): string {
  const upper = letter.toLocaleUpperCase('es')
  if (upper === 'Ñ') return 'Ñ'
  return upper.normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

export function isGuessable(char: string): boolean {
  return /^\p{L}$/u.test(char)
}

export interface BitBotState {
  word: string
  /** Letras ya elegidas, normalizadas, en el orden en que se eligieron */
  guessed: string[]
}

export function createBitBotGame(word: string): BitBotState {
  return { word: word.toLocaleUpperCase('es'), guessed: [] }
}

/** Letras distintas (normalizadas) que hay que descubrir */
export function lettersToFind(word: string): Set<string> {
  return new Set([...word].filter(isGuessable).map(normalizeLetter))
}

export function correctLetters(state: BitBotState): string[] {
  const target = lettersToFind(state.word)
  return state.guessed.filter((l) => target.has(l))
}

export function wrongLetters(state: BitBotState): string[] {
  const target = lettersToFind(state.word)
  return state.guessed.filter((l) => !target.has(l))
}

export function errorCount(state: BitBotState): number {
  return wrongLetters(state).length
}

export function attemptsLeft(state: BitBotState): number {
  return MAX_ERRORS - errorCount(state)
}

export type BitBotStatus = 'playing' | 'won' | 'lost'

export function getBitBotStatus(state: BitBotState): BitBotStatus {
  if (correctLetters(state).length === lettersToFind(state.word).size) return 'won'
  if (errorCount(state) >= MAX_ERRORS) return 'lost'
  return 'playing'
}

/** Elige una letra. Las repetidas o elegidas tras terminar la partida no cambian nada. */
export function guessLetter(state: BitBotState, letter: string): BitBotState {
  const normalized = normalizeLetter(letter)
  if (!isGuessable(normalized) || state.guessed.includes(normalized)) return state
  if (getBitBotStatus(state) !== 'playing') return state
  return { ...state, guessed: [...state.guessed, normalized] }
}

/** Palabra con las letras sin descubrir como `null`; los espacios y signos se muestran siempre */
export function maskedWord(state: BitBotState): (string | null)[] {
  const guessed = new Set(state.guessed)
  return [...state.word].map((char) => (!isGuessable(char) || guessed.has(normalizeLetter(char)) ? char : null))
}

/**
 * Piezas ensambladas: empiezan en tres y crecen con las letras acertadas.
 * Son independientes de los intentos (sección 6.4).
 */
export function assembledPieces(state: BitBotState): number {
  const status = getBitBotStatus(state)
  if (status === 'won') return TOTAL_PIECES
  const total = lettersToFind(state.word).size
  const found = correctLetters(state).length
  // Mientras falte alguna letra, BitBot no se completa
  return Math.min(TOTAL_PIECES - 1, INITIAL_PIECES + Math.floor(((TOTAL_PIECES - INITIAL_PIECES) * found) / total))
}

/** Elige un elemento al azar, evitando `exclude` cuando hay alternativas */
export function pickRandom<T>(items: T[], random: () => number = Math.random, exclude?: T): T {
  const pool = items.length > 1 && exclude !== undefined ? items.filter((i) => i !== exclude) : items
  return pool[Math.floor(random() * pool.length)]
}
