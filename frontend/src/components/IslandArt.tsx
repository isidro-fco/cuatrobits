import { SPHERE_COLORS } from '../data/ballSort'
import type { GameId } from '../types'
import { PixelSprite } from './PixelSprite'
import { useBitBotSprite } from '../hooks/useBitBotSprite'

const C4_PATTERN = ['r..r', 'y.r.', 'yr..', 'r..r']

function ConnectFourArt() {
  const fill = { r: '#ef5b5b', y: '#ffd35c', '.': '#eaf2ff' } as const
  return (
    <svg viewBox="0 0 100 100" className="island-art__svg">
      <rect x="4" y="4" width="92" height="92" rx="10" fill="#1a6be8" />
      {C4_PATTERN.flatMap((row, y) =>
        [...row].map((c, x) => (
          <circle key={`${x}-${y}`} cx={20 + x * 20} cy={20 + y * 20} r="7" fill={fill[c as keyof typeof fill]} />
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
          <rect x={8 + t * 23} y="10" width="16" height="80" rx="8" fill="#fff" stroke="#6f8aa3" strokeWidth="3" />
          {balls.map((color, i) => (
            <circle key={i} cx={16 + t * 23} cy={30 + i * 19} r="6.5" fill={SPHERE_COLORS[[2, 1, 0, 3][color]]} />
          ))}
        </g>
      ))}
    </svg>
  )
}

function MemoryArt() {
  const cards = ['★', '?', '?', '?']
  return (
    <svg viewBox="0 0 100 100" className="island-art__svg">
      {cards.map((label, i) => (
        <g key={i} transform={`translate(${6 + (i % 2) * 48} ${4 + Math.floor(i / 2) * 48})`}>
          <rect width="40" height="44" rx="6" fill="#c4520f" />
          <text x="20" y="30" textAnchor="middle" fontSize="20" fontWeight="800" fill="#fff">
            {label}
          </text>
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
