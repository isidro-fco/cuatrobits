/**
 * Archivo: BarraProgreso.tsx
 * Módulo: frontend / components
 * Descripción: Barra de progreso accesible (experiencia hacia el siguiente nivel).
 * Requerimientos: RF47, RNF02
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Tipos ----------
interface PropsBarraProgreso {
  valor: number
  max: number
  etiqueta: string
}

// ---------- Componente BarraProgreso ----------
/**
 * Barra de progreso accesible, por ejemplo la experiencia hacia el siguiente nivel.
 * @param props Propiedades del componente
 * @param props.valor Avance actual
 * @param props.max Valor con el que la barra se llena
 * @param props.etiqueta Texto visible o accesible
 * @returns Barra con rol progressbar y su valor
 * @see RF47
 */
export function BarraProgreso({ valor, max, etiqueta }: PropsBarraProgreso) {
  const porcentaje = max > 0 ? Math.min(100, (valor / max) * 100) : 0
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={etiqueta}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={valor}
    >
      <div className="progress__fill" style={{ width: `${porcentaje}%` }} />
    </div>
  )
}
