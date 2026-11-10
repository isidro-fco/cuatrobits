/**
 * Archivo: IconoPixel.tsx
 * Módulo: frontend / components
 * Descripción: Ícono en pixel art de una imagen del catálogo (Memorama y categorías).
 * Requerimientos: RF41, RNF08
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-22
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import { ICONOS_PIXEL, PALETA_PIXEL } from '../data/artePixel'
import { trazosPixel } from '../utils/trazosPixel'

// ---------- Tipos ----------
interface PropsIconoPixel {
  /** Emoji con que el contenido identifica la imagen */
  emoji: string
  /** Lado del sprite; por defecto el tamaño de la letra */
  tamano?: number | string
}

// ---------- Componente IconoPixel ----------
/**
 * Imagen del contenido (Memorama, categorías) dibujada como sprite de pixel art
 * @param props Propiedades del componente
 * @param props.emoji Emoji con que el contenido identifica la imagen
 * @param props.tamano Tamaño en píxeles
 * @returns Imagen SVG del sprite o el emoji si no tiene sprite
 * @see RF41, RNF08
 */
export function IconoPixel({ emoji, tamano = '1em' }: PropsIconoPixel) {
  const filas = ICONOS_PIXEL[emoji]
  // Una imagen nueva sin sprite todavía se muestra como emoji
  if (!filas) {
    return <span aria-hidden>{emoji}</span>
  }

  return (
    <svg
      className="pixel-icon"
      viewBox="0 0 16 16"
      width={tamano}
      height={tamano}
      shapeRendering="crispEdges"
      aria-hidden
    >
      {trazosPixel(filas).map((ruta) => (
        <path key={ruta.caracter} d={ruta.d} fill={PALETA_PIXEL[ruta.caracter]} />
      ))}
    </svg>
  )
}
