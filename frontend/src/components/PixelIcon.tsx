import { PIXEL_ICONS, PIXEL_PALETTE } from '../data/pixelArt'
import { pixelPaths } from '../utils/pixelPaths'

interface PixelIconProps {
  /** Emoji con que el contenido identifica la imagen */
  emoji: string
  /** Lado del sprite; por defecto el tamaño de la letra */
  size?: number | string
}

/** Imagen del contenido (Memorama, categorías) dibujada como sprite de pixel art */
export function PixelIcon({ emoji, size = '1em' }: PixelIconProps) {
  const rows = PIXEL_ICONS[emoji]
  // Una imagen nueva sin sprite todavía se muestra como emoji
  if (!rows) return <span aria-hidden>{emoji}</span>

  return (
    <svg className="pixel-icon" viewBox="0 0 16 16" width={size} height={size} shapeRendering="crispEdges" aria-hidden>
      {pixelPaths(rows).map((path) => (
        <path key={path.char} d={path.d} fill={PIXEL_PALETTE[path.char]} />
      ))}
    </svg>
  )
}
