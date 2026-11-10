/**
 * Archivo: MarcoPagina.tsx
 * Módulo: frontend / components
 * Descripción: Marco común de las pantallas: encabezado, fondo y contenido.
 * Requerimientos: RNF06, RNF08
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import type { ReactNode } from 'react'

// ---------- Módulos internos ----------
import { Fondo } from './Fondo'
import { Logo } from './Logo'

// ---------- Tipos ----------
interface PropsMarcoPagina {
  /** Contenido del lado derecho del encabezado (botones de navegación) */
  acciones?: ReactNode
  children: ReactNode
  ancho?: 'narrow' | 'medium' | 'wide'
}

// ---------- Componente MarcoPagina ----------
/**
 * Marco común de las pantallas: logotipo, acciones del encabezado, fondo y contenido.
 * @param props Propiedades del componente
 * @param props.acciones Botones que se muestran en el encabezado
 * @param props.children Contenido de la pantalla
 * @param props.ancho Ancho máximo del contenido
 * @returns Pantalla completa con su contenido
 * @see RNF06, RNF08
 */
export function MarcoPagina({ acciones, children, ancho = 'wide' }: PropsMarcoPagina) {
  return (
    <div className="shell">
      <Fondo />
      <header className="shell__header">
        <Logo />
        {acciones && <div className="shell__actions">{acciones}</div>}
      </header>
      <main className={`shell__main shell__main--${ancho}`}>{children}</main>
    </div>
  )
}
