import type { SVGProps } from 'react'
import { SPHERE_COLORS, SPHERE_SHADES } from '../data/ballSort'
import { pixelPaths } from '../utils/pixelPaths'

// El mismo dibujo que los círculos de colores del Memorama: F relleno, S sombra, H brillo, k contorno
const SPHERE = [
  '....kkkkkk....',
  '..kkFFFFFFkk..',
  '.kFFHHFFFFFSk.',
  '.kFHFFFFFFFSk.',
  'kFHFFFFFFFFFSk',
  'kFFFFFFFFFFFSk',
  'kFFFFFFFFFFFSk',
  'kFFFFFFFFFFFSk',
  'kFFFFFFFFFFSSk',
  'kFFFFFFFFFFSSk',
  '.kFFFFFFFFSSk.',
  '.kFFFFFFSSSSk.',
  '..kkSSSSSSkk..',
  '....kkkkkk....',
]

interface PixelSphereProps extends Omit<SVGProps<SVGSVGElement>, 'color' | 'fill' | 'width' | 'height'> {
  /** Índice del color en SPHERE_COLORS */
  color?: number
  /** Color de relleno y de sombra cuando no es una esfera del juego (admite `var(--…)`) */
  fill?: string
  shade?: string
  size?: number | string
}

/** Esfera (o ficha) redonda dibujada en pixel art */
export function PixelSphere({ color = 0, fill, shade, size = '100%', className, ...svgProps }: PixelSphereProps) {
  const palette: Record<string, string> = {
    k: '#14295c',
    F: fill ?? SPHERE_COLORS[color],
    S: shade ?? SPHERE_SHADES[color],
    H: '#ffffff',
  }
  return (
    <svg
      className={className ? `pixel-sphere ${className}` : 'pixel-sphere'}
      viewBox="0 0 14 14"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      aria-hidden
      {...svgProps}
    >
      {pixelPaths(SPHERE).map((path) => (
        <path key={path.char} d={path.d} style={{ fill: palette[path.char] }} />
      ))}
    </svg>
  )
}
