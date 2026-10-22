import type { GameId } from '../types'
import type { GlyphName } from '../data/pixelGlyphs'
import { PixelGlyph } from './PixelGlyph'
import { PixelSphere } from './PixelSphere'
import { PixelSprite } from './PixelSprite'
import { useBitBotSprite } from '../hooks/useBitBotSprite'

const C4_PATTERN = ['r..r', 'y.r.', 'yr..', 'r..r']

// Círculo de pixel art de 14 × 14 (el mismo contorno que las esferas) para los huecos del tablero
const PIXEL_CIRCLE = '4,0 10,0 10,1 12,1 12,2 13,2 13,4 14,4 14,10 13,10 13,12 12,12 12,13 10,13 10,14 4,14 4,13 2,13 2,12 1,12 1,10 0,10 0,4 1,4 1,2 2,2 2,1 4,1'

/** Rectángulo con esquinas en escalón de `s` unidades */
function steppedRect(x: number, y: number, w: number, h: number, s: number) {
  const r = x + w
  const b = y + h
  return [
    [x + 2 * s, y], [r - 2 * s, y], [r - 2 * s, y + s], [r - s, y + s], [r - s, y + 2 * s], [r, y + 2 * s],
    [r, b - 2 * s], [r - s, b - 2 * s], [r - s, b - s], [r - 2 * s, b - s], [r - 2 * s, b], [x + 2 * s, b],
    [x + 2 * s, b - s], [x + s, b - s], [x + s, b - 2 * s], [x, b - 2 * s], [x, y + 2 * s], [x + s, y + 2 * s],
    [x + s, y + s], [x + 2 * s, y + s],
  ]
    .map((p) => p.join(','))
    .join(' ')
}

function ConnectFourArt() {
  const fill = { r: '#ef5b5b', y: '#ffd35c', '.': '#eaf2ff' } as const
  return (
    <svg viewBox="0 0 100 100" className="island-art__svg">
      <polygon points={steppedRect(4, 4, 92, 92, 4)} fill="#1a6be8" />
      {C4_PATTERN.flatMap((row, y) =>
        [...row].map((c, x) => (
          <svg key={`${x}-${y}`} x={13 + x * 20} y={13 + y * 20} width="14" height="14" viewBox="0 0 14 14">
            <polygon points={PIXEL_CIRCLE} fill={fill[c as keyof typeof fill]} />
          </svg>
        )),
      )}
    </svg>
  )
}

function BallSortArt() {
  const tubes = [
    [2, 1, 0],
    [3, 2, 1],
    [0, 3, 2],
    [1, 0, 3],
  ]
  return (
    <svg viewBox="0 0 100 100" className="island-art__svg">
      {tubes.map((balls, t) => (
        <g key={t}>
          <polygon points={steppedRect(8 + t * 23, 10, 16, 80, 2)} fill="#6f8aa3" />
          <rect x={11 + t * 23} y="13" width="10" height="74" fill="#fff" />
          {balls.map((color, i) => (
            <PixelSphere key={i} color={[2, 1, 0, 3][color]} x={9 + t * 23} y={23 + i * 19} size={14} />
          ))}
        </g>
      ))}
    </svg>
  )
}

function MemoryArt() {
  const cards: GlyphName[] = ['star', 'question', 'question', 'question']
  return (
    <svg viewBox="0 0 100 100" className="island-art__svg">
      {cards.map((label, i) => (
        <g key={i} transform={`translate(${6 + (i % 2) * 48} ${4 + Math.floor(i / 2) * 48})`}>
          <polygon points={steppedRect(0, 0, 40, 44, 3)} fill="#c4520f" />
          <PixelGlyph name={label} x="11" y="13" size={18} color="#fff" />
        </g>
      ))}
    </svg>
  )
}

function BitBotArt() {
  return (
    <span className="island-art__bitbot">
      <PixelSprite sprite={useBitBotSprite()} size="100%" />
    </span>
  )
}

export function IslandArt({ game }: { game: GameId }) {
  return (
    <span className="island-art" aria-hidden>
      {game === 'connect-four' && <ConnectFourArt />}
      {game === 'bitbot' && <BitBotArt />}
      {game === 'ball-sort' && <BallSortArt />}
      {game === 'memory' && <MemoryArt />}
    </span>
  )
}
