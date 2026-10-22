import type { SVGProps } from 'react'
import { PIXEL_GLYPHS, type GlyphName } from '../data/pixelGlyphs'
import { pixelPaths } from '../utils/pixelPaths'

interface PixelGlyphProps extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  name: GlyphName
  /** Lado del símbolo; por defecto el tamaño de la letra, como el carácter al que reemplaza */
  size?: number | string
}

/** Símbolo de pixel art (★, ♥, ✓…) pintado con el color del texto */
export function PixelGlyph({ name, size = '1em', className, ...svgProps }: PixelGlyphProps) {
  return (
    <svg
      className={className ? `pixel-glyph ${className}` : 'pixel-glyph'}
      viewBox="0 0 9 9"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      fill="currentColor"
      aria-hidden
      {...svgProps}
    >
      {pixelPaths(PIXEL_GLYPHS[name]).map((path) => (
        <path key={path.char} d={path.d} />
      ))}
    </svg>
  )
}
