import { useEffect, useEffectEvent, useState, type CSSProperties } from 'react'
import { PixelGlyph } from '../../components/PixelGlyph'
import { PixelSphere } from '../../components/PixelSphere'
import { playSfx } from '../../services/audio'
import { useActivePlayer } from '../../stores/playerStore'
import type { GameProps } from '../types'
import { chooseAiMove } from './ai'
import { AI_DIFFICULTY_NAMES, type ConnectFourConfig, DISC_SYMBOLS, pickDiscColors } from './config'
import { applyMove, COLS, createBoard, type Disc, getStatus, type Position, ROWS } from './logic'

const AI_DELAY_MS = 600

// Sombra de la ficha: su propio color oscurecido
const DISC_SHADE = 'color-mix(in srgb, var(--disc), #14295c 30%)'

export function ConnectFourGame({ config, paused, onFinish }: GameProps<ConnectFourConfig>) {
  const player = useActivePlayer()
  const [colors] = useState(() => pickDiscColors())
  const [board, setBoard] = useState(createBoard)
  const [turn, setTurn] = useState<Disc>(0)
  const [moves, setMoves] = useState(0)
  const [lastMove, setLastMove] = useState<Position | null>(null)

  const names = [player?.username ?? 'Jugador 1', config.mode === 'ai' ? 'BitBot' : 'Jugador 2']
  const status = getStatus(board)
  const aiTurn = config.mode === 'ai' && turn === 1
  const winCells = new Set(status.kind === 'win' ? status.win.cells.map(([r, c]) => `${r}-${c}`) : [])

  function play(col: number) {
    if (status.kind !== 'playing') return
    const { board: next, row } = applyMove(board, col, turn)
    const totalMoves = moves + 1
    setBoard(next)
    setMoves(totalMoves)
    setLastMove([row, col])
    setTurn((1 - turn) as Disc)
    playSfx('drop')

    const end = getStatus(next)
    if (end.kind === 'playing') return
    const winner = end.kind === 'win' ? names[end.win.winner] : null
    const modeName = config.mode === 'ai' ? `Contra BitBot (${AI_DIFFICULTY_NAMES[config.difficulty]})` : 'Dos jugadores'
    onFinish({
      result: end.kind === 'draw' ? 'draw' : end.win.winner === 0 ? 'win' : 'loss',
      summary: `${modeName} · ${totalMoves} movimientos`,
      stats: [
        { label: 'Movimientos', value: totalMoves },
        config.mode === 'ai'
          ? { label: 'Dificultad de BitBot', value: AI_DIFFICULTY_NAMES[config.difficulty] }
          : { label: 'Modo de juego', value: '2 jugadores' },
      ],
      message: winner ? `¡Ganó ${winner}!` : 'El tablero se llenó sin ganador.',
      details: {
        players: names,
        mode: config.mode,
        difficulty: config.mode === 'ai' ? config.difficulty : null,
        moves: totalMoves,
        winner,
      },
    })
  }

  // Turno de la IA; el temporizador se reprograma al salir de la pausa
  const aiShouldMove = aiTurn && !paused && status.kind === 'playing'
  const playAiMove = useEffectEvent(() => {
    if (config.mode === 'ai') play(chooseAiMove(board, 1, config.difficulty))
  })
  useEffect(() => {
    if (!aiShouldMove) return
    const id = window.setTimeout(playAiMove, AI_DELAY_MS)
    return () => window.clearTimeout(id)
  }, [aiShouldMove])

  let statusText: string
  if (status.kind === 'win') statusText = `¡${names[status.win.winner]} conectó cuatro!`
  else if (status.kind === 'draw') statusText = '¡Empate! El tablero está lleno.'
  else if (aiTurn) statusText = 'BitBot está pensando…'
  else statusText = `Turno de ${names[turn]}`

  return (
    <div className="c4">
      <div className="c4__players">
        {names.map((name, i) => (
          <div
            key={i}
            className="c4__player"
            data-active={status.kind === 'playing' && turn === i}
            style={{ '--disc': colors[i].color, '--disc-ink': colors[i].ink } as CSSProperties}
          >
            <span className="c4__disc c4__disc--small" aria-hidden>
              <PixelSphere fill="var(--disc)" shade={DISC_SHADE} />
              <PixelGlyph name={DISC_SYMBOLS[i]} />
            </span>
            <span>
              <strong>{name}</strong>
              <span className="c4__player-sub">
                Ficha {colors[i].name} <PixelGlyph name={DISC_SYMBOLS[i]} />
              </span>
            </span>
          </div>
        ))}
      </div>

      <p className="game-status" role="status">
        {statusText}
      </p>

      <div className="c4__frame">
        <div className="c4__board">
          {Array.from({ length: COLS }, (_, col) => {
            const full = board[0][col] !== null
            return (
              <button
                key={col}
                type="button"
                className="c4__column"
                aria-label={`Columna ${col + 1}${full ? ', llena' : ''}`}
                disabled={full || aiTurn || status.kind !== 'playing'}
                onClick={() => play(col)}
              >
                {Array.from({ length: ROWS }, (_, row) => {
                  const cell = board[row][col]
                  const isLast = lastMove?.[0] === row && lastMove[1] === col
                  return (
                    <span key={row} className="c4__cell">
                      {cell !== null && (
                        <span
                          className={`c4__disc ${isLast ? 'c4__disc--drop' : ''} ${winCells.has(`${row}-${col}`) ? 'c4__disc--win' : ''}`}
                          style={{ '--disc': colors[cell].color, '--disc-ink': colors[cell].ink, '--drop-rows': row + 1 } as CSSProperties}
                          aria-hidden
                        >
                          <PixelSphere fill="var(--disc)" shade={DISC_SHADE} />
                          <PixelGlyph name={DISC_SYMBOLS[cell]} />
                        </span>
                      )}
                    </span>
                  )
                })}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
