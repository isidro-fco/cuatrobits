/**
 * Archivo: SpritePixel.tsx
 * Módulo: frontend / components
 * Descripción: Dibuja un sprite de pixel art (BitBot y avatares) con sus accesorios.
 * Requerimientos: RF49, RNF08
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import type { DefinicionSprite } from '../data/sprites'

// ---------- Tipos ----------
interface PropsSpritePixel {
  sprite: DefinicionSprite
  tamano?: number | string
  titulo?: string
}

// ---------- Componente SpritePixel ----------
function espejo(mitad: string[]): string[] {
  return mitad.map((fila) => fila + [...fila].reverse().join(''))
}

/**
 * Dibuja un sprite de pixel art (BitBot y avatares) con sus accesorios.
 * @param props Propiedades del componente
 * @param props.sprite Filas, paleta y accesorios del sprite
 * @param props.tamano Tamaño en píxeles
 * @param props.titulo Texto accesible; sin él la imagen es decorativa
 * @returns Imagen SVG del sprite
 * @see RF49, RNF08
 */
export function SpritePixel({ sprite, tamano = 64, titulo }: PropsSpritePixel) {
  const filas = espejo(sprite.mitad)
  const ancho = filas[0].length
  const pixeles: { x: number; y: number; color: string }[] = []
  filas.forEach((fila, indice) => {
    ;[...fila].forEach((caracter, indiceActual) => {
      const color = sprite.paleta[caracter]
      if (color) {
        pixeles.push({ x: indiceActual, y: indice, color })
      }
    })
  })

  return (
    <svg
      viewBox={`0 0 ${ancho} ${filas.length}`}
      width={tamano}
      height={tamano}
      shapeRendering="crispEdges"
      role={titulo ? 'img' : undefined}
      aria-hidden={titulo ? undefined : true}
    >
      {titulo && <title>{titulo}</title>}
      {pixeles.map((pixel) => (
        <rect
          key={`${pixel.x}-${pixel.y}`}
          x={pixel.x}
          y={pixel.y}
          width={1.02}
          height={1.02}
          fill={pixel.color}
        />
      ))}
    </svg>
  )
}
