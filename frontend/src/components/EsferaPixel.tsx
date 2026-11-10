/**
 * Archivo: EsferaPixel.tsx
 * Módulo: frontend / components
 * Descripción: Esfera en pixel art (relleno, sombra, brillo y contorno), igual a los círculos de
 *              colores del Memorama.
 * Requerimientos: RF34, RNF03, RNF08
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-22
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import type { SVGProps } from 'react'

// ---------- Módulos internos ----------
import { COLORES_ESFERAS, SOMBRAS_ESFERAS } from '../data/esferas'
import { trazosPixel } from '../utils/trazosPixel'

// ---------- Tipos ----------
interface PropsEsferaPixel extends Omit<
  SVGProps<SVGSVGElement>,
  'color' | 'fill' | 'width' | 'height'
> {
  /** Índice del color en SPHERE_COLORS */
  color?: number
  /** Color de relleno y de sombra cuando no es una esfera del juego (admite `var(--…)`) */
  relleno?: string
  sombra?: string
  tamano?: number | string
}

// ---------- Constantes ----------
// El mismo dibujo que los círculos de colores del Memorama: F relleno, S sombra, H brillo, k
// contorno
const ESFERA = [
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

// ---------- Componente EsferaPixel ----------
/**
 * Esfera (o ficha) redonda dibujada en pixel art
 * @param props Propiedades del componente
 * @param props.color Índice del color en la paleta de esferas
 * @param props.relleno Color de relleno que reemplaza al de la paleta
 * @param props.sombra Color de sombra que reemplaza al de la paleta
 * @param props.tamano Tamaño en píxeles
 * @param props.className Clases CSS adicionales
 * @param props.propsSvg Demás atributos del elemento svg
 * @returns Imagen SVG de la esfera
 * @see RF34, RNF08
 */
export function EsferaPixel({
  color = 0,
  relleno,
  sombra,
  tamano = '100%',
  className,
  ...propsSvg
}: PropsEsferaPixel) {
  const paleta: Record<string, string> = {
    k: '#14295c',
    F: relleno ?? COLORES_ESFERAS[color],
    S: sombra ?? SOMBRAS_ESFERAS[color],
    H: '#ffffff',
  }
  return (
    <svg
      className={className ? `pixel-sphere ${className}` : 'pixel-sphere'}
      viewBox="0 0 14 14"
      width={tamano}
      height={tamano}
      shapeRendering="crispEdges"
      aria-hidden
      {...propsSvg}
    >
      {trazosPixel(ESFERA).map((ruta) => (
        <path key={ruta.caracter} d={ruta.d} style={{ fill: paleta[ruta.caracter] }} />
      ))}
    </svg>
  )
}
