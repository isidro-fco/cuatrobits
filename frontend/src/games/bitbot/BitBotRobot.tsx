import { TOTAL_PIECES } from './logic'

type Rect = [x: number, y: number, width: number, height: number, color: string]

interface Piece {
  name: string
  rects: Rect[]
}

const BLUE = '#1a6be8'
const NAVY = '#14295c'
const WHITE = '#ffffff'
const YELLOW = '#ffd35c'

// Ocho piezas en el orden en que se ensamblan (sección 6.4)
const PIECES: Piece[] = [
  { name: 'cuerpo', rects: [[6, 13, 12, 8, BLUE], [9, 15, 6, 3, WHITE], [11, 16, 2, 1, YELLOW]] },
  { name: 'pierna izquierda', rects: [[7, 21, 3, 4, NAVY], [6, 25, 5, 2, BLUE]] },
  { name: 'pierna derecha', rects: [[14, 21, 3, 4, NAVY], [13, 25, 5, 2, BLUE]] },
  { name: 'cabeza', rects: [[5, 4, 14, 8, BLUE], [11, 12, 2, 1, NAVY]] },
  { name: 'brazo izquierdo', rects: [[3, 14, 3, 6, BLUE], [2, 20, 3, 2, NAVY]] },
  { name: 'brazo derecho', rects: [[18, 14, 3, 6, BLUE], [19, 20, 3, 2, NAVY]] },
  { name: 'cara', rects: [[7, 6, 10, 4, WHITE], [9, 7, 2, 2, NAVY], [13, 7, 2, 2, NAVY]] },
  { name: 'antena', rects: [[11, 1, 2, 3, NAVY], [10, 0, 4, 2, YELLOW]] },
]

if (PIECES.length !== TOTAL_PIECES) throw new Error('BitBot debe tener ocho piezas')

interface BitBotRobotProps {
  assembled: number
  celebrating?: boolean
  /** Color del cuerpo elegido en el taller de BitBot */
  color?: string
}

export function BitBotRobot({ assembled, celebrating = false, color: body = BLUE }: BitBotRobotProps) {
  return (
    <figure className="bitbot-robot" data-celebrating={celebrating}>
      <svg viewBox="-1 -1 26 30" role="img" aria-label={`BitBot con ${assembled} de ${TOTAL_PIECES} piezas`}>
        {PIECES.map((piece, i) => {
          const done = i < assembled
          return (
            <g key={piece.name} className={done ? 'bitbot-robot__piece is-done' : 'bitbot-robot__piece'}>
              {piece.rects.map(([x, y, w, h, color], j) => (
                <rect
                  key={j}
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fill={done ? (color === BLUE ? body : color) : 'none'}
                  stroke={done ? 'none' : '#9fb0c4'}
                  strokeWidth={done ? 0 : 0.35}
                  strokeDasharray={done ? undefined : '0.8 0.6'}
                />
              ))}
            </g>
          )
        })}
      </svg>
      <figcaption>
        Piezas: <strong>{assembled}</strong> / {TOTAL_PIECES}
      </figcaption>
    </figure>
  )
}
