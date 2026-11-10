/**
 * Archivo: GlifoPixel.tsx
 * Módulo: frontend / components
 * Descripción: Símbolos de pixel art que reemplazan a los caracteres ★ ● ♥ ✓ del texto.
 * Requerimientos: RNF03, RNF08
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-22
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import type { SVGProps } from 'react'

// ---------- Módulos internos ----------
import { GLIFOS_PIXEL, type NombreGlifo } from '../data/glifosPixel'
import { trazosPixel } from '../utils/trazosPixel'

// ---------- Tipos ----------
interface PropsGlifoPixel extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height' | 'name'> {
  nombre: NombreGlifo
  /** Lado del símbolo; por defecto el tamaño de la letra, como el carácter al que reemplaza */
  tamano?: number | string
}

// ---------- Componente GlifoPixel ----------
/**
 * Símbolo de pixel art (★, ♥, ✓…) pintado con el color del texto
 * @param props Propiedades del componente
 * @param props.name Nombre del símbolo en GLIFOS_PIXEL
 * @param props.tamano Tamaño en píxeles
 * @param props.className Clases CSS adicionales
 * @param props.propsSvg Demás atributos del elemento svg
 * @returns Imagen SVG del símbolo
 * @see RNF03, RNF08
 */
export function GlifoPixel({ nombre, tamano = '1em', className, ...propsSvg }: PropsGlifoPixel) {
  return (
    <svg
      className={className ? `pixel-glyph ${className}` : 'pixel-glyph'}
      viewBox="0 0 9 9"
      width={tamano}
      height={tamano}
      shapeRendering="crispEdges"
      fill="currentColor"
      aria-hidden
      {...propsSvg}
    >
      {trazosPixel(GLIFOS_PIXEL[nombre]).map((ruta) => (
        <path key={ruta.caracter} d={ruta.d} />
      ))}
    </svg>
  )
}
