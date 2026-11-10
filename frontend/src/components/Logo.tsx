/**
 * Archivo: Logo.tsx
 * Módulo: frontend / components
 * Descripción: Ícono y nombre de CuatroBits.
 * Requerimientos: RNF08
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { Link } from 'react-router'

// ---------- Módulos internos ----------
import { SpritePixel } from './SpritePixel'
import { SPRITE_BITBOT } from '../data/sprites'

// ---------- Componente Logo ----------
/**
 * Ícono y nombre de CuatroBits, sin enlace
 * @param props Propiedades del componente
 * @param props.tamano Tamaño del ícono en píxeles
 * @returns Ícono con el nombre de la aplicación
 * @see RNF08
 */
export function MarcaLogo({ tamano = 40 }: { tamano?: number }) {
  return (
    <>
      <span className="logo__icon">
        <SpritePixel sprite={SPRITE_BITBOT} tamano={tamano} />
      </span>
      <span className="logo__text">
        Cuatro<span>Bits</span>
      </span>
    </>
  )
}

/**
 * Logotipo con enlace al lobby.
 * @returns Enlace con el logotipo
 * @see RF09, RNF08
 */
export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="CuatroBits, ir al lobby">
      <MarcaLogo />
    </Link>
  )
}
