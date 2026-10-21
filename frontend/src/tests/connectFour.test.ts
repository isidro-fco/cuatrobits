import { describe, expect, it } from 'vitest'
import { chooseAiMove, type AiDifficulty } from '../games/connect-four/ai'
import { areSimilar, DISC_PALETTE, parseConnectFourConfig, pickDiscColors } from '../games/connect-four/config'
import {
  applyMove,
  boardFromRows,
  COLS,
  createBoard,
  type Disc,
  dropRow,
  findWin,
  getStatus,
  isValidMove,
  ROWS,
  validMoves,
} from '../games/connect-four/logic'

const EMPTY = '.......'

/** Generador pseudoaleatorio reproducible */
function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32
    return seed / 2 ** 32
  }
}

describe('reglas de Conecta 4 (sección 16.2)', () => {
  it('el tablero comienza vacío con 6 filas y 7 columnas', () => {
    const board = createBoard()
    expect(board).toHaveLength(ROWS)
    expect(board.every((row) => row.length === COLS && row.every((c) => c === null))).toBe(true)
  })

  it('la ficha ocupa la posición libre más baja de la columna', () => {
    let board = createBoard()
    board = applyMove(board, 3, 0).board
    const second = applyMove(board, 3, 1)
    expect(board[ROWS - 1][3]).toBe(0)
    expect(second.row).toBe(ROWS - 2)
    expect(second.board[ROWS - 2][3]).toBe(1)
  })

  it('no permite movimientos en columnas llenas', () => {
    let board = createBoard()
    for (let i = 0; i < ROWS; i++) board = applyMove(board, 0, (i % 2) as Disc).board
    expect(dropRow(board, 0)).toBe(-1)
    expect(isValidMove(board, 0)).toBe(false)
    expect(validMoves(board)).not.toContain(0)
    expect(() => applyMove(board, 0, 0)).toThrow()
  })

  it('no modifica el tablero original', () => {
    const board = createBoard()
    applyMove(board, 2, 0)
    expect(board[ROWS - 1][2]).toBeNull()
  })

  it('detecta victorias horizontales', () => {
    const board = boardFromRows([EMPTY, EMPTY, EMPTY, EMPTY, '.111...', '.0000..'])
    expect(findWin(board)).toEqual({ winner: 0, cells: [[5, 1], [5, 2], [5, 3], [5, 4]] })
  })

  it('detecta victorias verticales', () => {
    const board = boardFromRows([EMPTY, EMPTY, '..1....', '..10...', '..10...', '..10...'])
    expect(findWin(board)?.winner).toBe(1)
    expect(findWin(board)?.cells).toHaveLength(4)
  })

  it('detecta victorias en diagonal ascendente y descendente', () => {
    const up = boardFromRows([EMPTY, EMPTY, '...0...', '..01...', '.011...', '0111...'])
    expect(findWin(up)?.winner).toBe(0)
    const down = boardFromRows([EMPTY, EMPTY, '1......', '01.....', '001....', '0001...'])
    expect(findWin(down)?.winner).toBe(1)
  })

  it('tres en línea no es victoria', () => {
    const board = boardFromRows([EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, '000.111'])
    expect(findWin(board)).toBeNull()
    expect(getStatus(board).kind).toBe('playing')
  })

  it('detecta el empate cuando el tablero se llena sin ganador', () => {
    const board = boardFromRows(['0011001', '1100110', '0011001', '1100110', '0011001', '1100110'])
    expect(findWin(board)).toBeNull()
    expect(getStatus(board).kind).toBe('draw')
  })
})

describe('IA de Conecta 4', () => {
  const difficulties: AiDifficulty[] = ['easy', 'normal', 'hard']

  it.each(difficulties)('en dificultad %s realiza siempre movimientos válidos', (difficulty) => {
    const random = seeded(7)
    let board = createBoard()
    let turn: Disc = 0
    while (getStatus(board).kind === 'playing') {
      const col =
        turn === 1 ? chooseAiMove(board, 1, difficulty, random) : validMoves(board)[Math.floor(random() * validMoves(board).length)]
      expect(isValidMove(board, col)).toBe(true)
      board = applyMove(board, col, turn).board
      turn = (1 - turn) as Disc
    }
  })

  it('juega en la única columna libre', () => {
    const board = boardFromRows(['00110.1', '1100110', '0011001', '1100110', '0011001', '1100110'])
    expect(chooseAiMove(board, 1, 'hard')).toBe(5)
  })

  it.each(['normal', 'hard'] as const)('en dificultad %s aprovecha una jugada ganadora', (difficulty) => {
    const board = boardFromRows([EMPTY, EMPTY, EMPTY, EMPTY, '0.0....', '0111...'])
    expect(chooseAiMove(board, 1, difficulty)).toBe(4)
  })

  it.each(['normal', 'hard'] as const)('en dificultad %s bloquea la victoria inmediata del rival', (difficulty) => {
    const board = boardFromRows([EMPTY, EMPTY, EMPTY, EMPTY, '1...1..', '000.1..'])
    expect(chooseAiMove(board, 1, difficulty)).toBe(3)
  })

  it('en dificultad difícil prefiere ganar antes que bloquear', () => {
    const board = boardFromRows([EMPTY, EMPTY, EMPTY, '1......', '1......', '1000...'])
    expect(chooseAiMove(board, 1, 'hard')).toBe(0)
  })
})

describe('configuración de Conecta 4', () => {
  it('lee el modo y la dificultad de la URL', () => {
    expect(parseConnectFourConfig(new URLSearchParams('modo=ia&dificultad=hard'))).toEqual({
      mode: 'ai',
      difficulty: 'hard',
    })
    expect(parseConnectFourConfig(new URLSearchParams('modo=local'))).toEqual({ mode: 'local' })
    expect(parseConnectFourConfig(new URLSearchParams('modo=ia'))).toBeNull()
    expect(parseConnectFourConfig(new URLSearchParams(''))).toBeNull()
  })

  it('asigna dos colores distintos (sección 5.3)', () => {
    const random = seeded(3)
    for (let i = 0; i < 50; i++) {
      const [a, b] = pickDiscColors(random)
      expect(a.color).not.toBe(b.color)
      expect(areSimilar(a, b)).toBe(false)
    }
  })

  // Contraste según WCAG: luminancia relativa de un color hexadecimal
  const luminance = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const contrast = (a: string, b: string) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
    return (hi + 0.05) / (lo + 0.05)
  }

  // Intensidad del color: 0 en blancos y grises, 1 en colores puros
  const chroma = (hex: string) => {
    const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    return Math.max(...channels) - Math.min(...channels)
  }

  it('todas las fichas son de colores intensos y su símbolo se lee', () => {
    // La paleta anterior tenía blanco (0) y un lila pálido (0.31), que se confundían con los huecos
    expect(chroma('#ffffff')).toBe(0)
    expect(chroma('#c4b0ff')).toBeLessThan(0.5)
    for (const disc of DISC_PALETTE) {
      expect(chroma(disc.color), disc.name).toBeGreaterThanOrEqual(0.5)
      expect(contrast(disc.color, disc.ink), disc.name).toBeGreaterThanOrEqual(3)
    }
  })

  it('con cualquier primer color quedan opciones para el segundo', () => {
    for (let i = 0; i < DISC_PALETTE.length; i++) {
      const [a, b] = pickDiscColors(() => (i + 0.5) / DISC_PALETTE.length)
      expect(a).toBe(DISC_PALETTE[i])
      expect(b).toBeDefined()
    }
  })
})
