import type { SpriteDefinition } from '../data/sprites'

function mirror(half: string[]): string[] {
  return half.map((row) => row + [...row].reverse().join(''))
}

interface PixelSpriteProps {
  sprite: SpriteDefinition
  size?: number | string
  title?: string
}

export function PixelSprite({ sprite, size = 64, title }: PixelSpriteProps) {
  const rows = mirror(sprite.half)
  const width = rows[0].length
  const pixels: { x: number; y: number; color: string }[] = []
  rows.forEach((row, y) => {
    ;[...row].forEach((char, x) => {
      const color = sprite.palette[char]
      if (color) pixels.push({ x, y, color })
    })
  })

  return (
    <svg
      viewBox={`0 0 ${width} ${rows.length}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      {pixels.map((p) => (
        <rect key={`${p.x}-${p.y}`} x={p.x} y={p.y} width={1.02} height={1.02} fill={p.color} />
      ))}
    </svg>
  )
}
