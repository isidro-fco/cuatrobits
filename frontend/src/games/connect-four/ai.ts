// IA de Conecta 4: Minimax con poda alfa-beta (sección 5.5)
import { applyMove, COLS, CONNECT, type Board, type Disc, isBoardFull, isWinningCell, ROWS, validMoves } from './logic'

export type AiDifficulty = 'easy' | 'normal' | 'hard'

interface AiParams {
  /** Profundidad de búsqueda en medios turnos */
  depth: number
  /** Probabilidad de elegir una jugada al azar en lugar de la mejor */
  mistakeRate: number
  /** Peso de la evaluación posicional (ventanas y centro) */
  positional: boolean
}

// La dificultad solo cambia parámetros de búsqueda y evaluación
export const AI_PARAMS: Record<AiDifficulty, AiParams> = {
  easy: { depth: 2, mistakeRate: 0.35, positional: false },
  normal: { depth: 4, mistakeRate: 0, positional: true },
  hard: { depth: 6, mistakeRate: 0, positional: true },
}

const WIN_SCORE = 1_000_000
// Explorar primero el centro mejora la poda
const COLUMN_ORDER = [3, 2, 4, 1, 5, 0, 6].filter((c) => c < COLS)

function scoreWindow(cells: (Disc | null)[], me: Disc): number {
  let mine = 0
  let theirs = 0
  for (const cell of cells) {
    if (cell === me) mine++
    else if (cell !== null) theirs++
  }
  if (mine > 0 && theirs > 0) return 0
  if (mine === 3) return 6
  if (mine === 2) return 2
  if (theirs === 3) return -8
  if (theirs === 2) return -2
  return 0
}

/** Evaluación heurística de una posición no terminal desde el punto de vista de `me` */
export function evaluate(board: Board, me: Disc): number {
  let score = 0
  const center = Math.floor(COLS / 2)
  for (let row = 0; row < ROWS; row++) {
    if (board[row][center] === me) score += 3
    else if (board[row][center] !== null) score -= 3
  }
  const windows: [number, number][] = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ]
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      for (const [dr, dc] of windows) {
        const endRow = row + dr * (CONNECT - 1)
        const endCol = col + dc * (CONNECT - 1)
        if (endRow >= ROWS || endCol < 0 || endCol >= COLS) continue
        const cells = Array.from({ length: CONNECT }, (_, i) => board[row + dr * i][col + dc * i])
        score += scoreWindow(cells, me)
      }
    }
  }
  return score
}

/** Valor de jugar `col` con la ficha `turn`, buscando `depth` medios turnos más */
function scoreMove(
  board: Board,
  col: number,
  depth: number,
  alpha: number,
  beta: number,
  turn: Disc,
  me: Disc,
  positional: boolean,
): number {
  const { board: next, row } = applyMove(board, col, turn)
  // Las victorias cercanas valen más que las lejanas, y las derrotas cercanas pesan más
  if (isWinningCell(next, row, col)) return turn === me ? WIN_SCORE + depth : -WIN_SCORE - depth
  if (isBoardFull(next)) return 0
  if (depth === 0) return positional ? evaluate(next, me) : 0

  const opponent = (1 - turn) as Disc
  const maximizing = opponent === me
  let best = maximizing ? -Infinity : Infinity
  for (const c of COLUMN_ORDER) {
    if (next[0][c] !== null) continue
    const score = scoreMove(next, c, depth - 1, alpha, beta, opponent, me, positional)
    if (maximizing) {
      best = Math.max(best, score)
      alpha = Math.max(alpha, score)
    } else {
      best = Math.min(best, score)
      beta = Math.min(beta, score)
    }
    if (alpha >= beta) break
  }
  return best
}

/** Elige la columna en la que jugará la IA. `random` permite pruebas deterministas. */
export function chooseAiMove(
  board: Board,
  me: Disc,
  difficulty: AiDifficulty,
  random: () => number = Math.random,
): number {
  const moves = validMoves(board)
  if (moves.length === 0) throw new Error('No quedan movimientos')
  const params = AI_PARAMS[difficulty]

  if (params.mistakeRate > 0 && random() < params.mistakeRate) {
    return moves[Math.floor(random() * moves.length)]
  }

  let bestScore = -Infinity
  let bestMoves: number[] = []
  for (const col of COLUMN_ORDER) {
    if (!moves.includes(col)) continue
    const score = scoreMove(board, col, params.depth - 1, -Infinity, Infinity, me, me, params.positional)
    if (score > bestScore) {
      bestScore = score
      bestMoves = [col]
    } else if (score === bestScore) {
      bestMoves.push(col)
    }
  }
  // Entre jugadas equivalentes se elige al azar para que las partidas varíen
  return bestMoves[Math.floor(random() * bestMoves.length)]
}
