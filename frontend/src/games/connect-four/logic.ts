// Reglas de Conecta 4 (sección 5.4). Funciones puras sobre un tablero inmutable.

export const ROWS = 6
export const COLS = 7
export const CONNECT = 4

/** Índice del participante: 0 inicia la partida, 1 responde */
export type Disc = 0 | 1
export type Cell = Disc | null
/** `board[fila][columna]`; la fila 0 es la superior */
export type Board = Cell[][]
export type Position = readonly [row: number, col: number]

export function createBoard(): Board {
  return Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null))
}

/** Fila libre más baja de la columna, o -1 si está llena */
export function dropRow(board: Board, col: number): number {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === null) return row
  }
  return -1
}

export function isValidMove(board: Board, col: number): boolean {
  return Number.isInteger(col) && col >= 0 && col < COLS && board[0][col] === null
}

export function validMoves(board: Board): number[] {
  const moves: number[] = []
  for (let col = 0; col < COLS; col++) if (isValidMove(board, col)) moves.push(col)
  return moves
}

/** Coloca la ficha en la posición libre más baja; lanza un error si la columna está llena */
export function applyMove(board: Board, col: number, disc: Disc): { board: Board; row: number } {
  if (!isValidMove(board, col)) throw new Error(`La columna ${col} no admite más fichas`)
  const row = dropRow(board, col)
  const next = board.map((r) => r.slice())
  next[row][col] = disc
  return { board: next, row }
}

const DIRECTIONS: Position[] = [
  [0, 1], // horizontal
  [1, 0], // vertical
  [1, 1], // diagonal descendente
  [1, -1], // diagonal ascendente
]

export interface Win {
  winner: Disc
  cells: Position[]
}

/** Busca cuatro fichas consecutivas del mismo participante */
export function findWin(board: Board): Win | null {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const disc = board[row][col]
      if (disc === null) continue
      for (const [dr, dc] of DIRECTIONS) {
        const cells: Position[] = []
        for (let i = 0; i < CONNECT; i++) {
          const r = row + dr * i
          const c = col + dc * i
          if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c] !== disc) break
          cells.push([r, c])
        }
        if (cells.length === CONNECT) return { winner: disc, cells }
      }
    }
  }
  return null
}

/** Verdadero si la ficha en (row, col) forma parte de una línea de cuatro; más rápido que `findWin` */
export function isWinningCell(board: Board, row: number, col: number): boolean {
  const disc = board[row][col]
  if (disc === null) return false
  for (const [dr, dc] of DIRECTIONS) {
    let count = 1
    for (const sign of [1, -1]) {
      let r = row + dr * sign
      let c = col + dc * sign
      while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === disc) {
        count++
        r += dr * sign
        c += dc * sign
      }
    }
    if (count >= CONNECT) return true
  }
  return false
}

export function isBoardFull(board: Board): boolean {
  return board[0].every((cell) => cell !== null)
}

export type Status = { kind: 'playing' } | { kind: 'win'; win: Win } | { kind: 'draw' }

export function getStatus(board: Board): Status {
  const win = findWin(board)
  if (win) return { kind: 'win', win }
  if (isBoardFull(board)) return { kind: 'draw' }
  return { kind: 'playing' }
}

/** Construye un tablero a partir de filas de texto (`.`, `0`, `1`); útil en pruebas */
export function boardFromRows(rows: string[]): Board {
  return rows.map((row) => [...row].map((c) => (c === '0' ? 0 : c === '1' ? 1 : null)))
}
