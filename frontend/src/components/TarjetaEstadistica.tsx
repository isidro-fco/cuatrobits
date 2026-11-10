/**
 * Archivo: TarjetaEstadistica.tsx
 * Módulo: frontend / components
 * Descripción: Tarjeta con un valor numérico y su etiqueta (perfil e historial).
 * Requerimientos: RF51, RIU03
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import type { CSSProperties, ReactNode } from 'react'

// ---------- Tipos ----------
interface PropsTarjetaEstadistica {
  valor: ReactNode
  etiqueta: string
  color: string
  icono?: ReactNode
}

// ---------- Componente TarjetaEstadistica ----------
/**
 * Tarjeta con un valor numérico y su etiqueta.
 * @param props Propiedades del componente
 * @param props.valor Número que se muestra
 * @param props.etiqueta Texto visible o accesible
 * @param props.color Color de acento de la tarjeta
 * @param props.icono Ícono que acompaña al valor
 * @returns Tarjeta con el valor, la etiqueta y el ícono
 * @see RF51, RIU03
 */
export function TarjetaEstadistica({ valor, etiqueta, color, icono }: PropsTarjetaEstadistica) {
  return (
    <div className="stat-card card" style={{ '--accent': color } as CSSProperties}>
      <span className="stat-card__dot" aria-hidden>
        {icono}
      </span>
      <span>
        <strong className="stat-card__value">{valor}</strong>
        <span className="stat-card__label">{etiqueta}</span>
      </span>
    </div>
  )
}
