/**
 * Archivo: Interruptor.tsx
 * Módulo: frontend / components
 * Descripción: Interruptor accesible para activar o desactivar una preferencia.
 * Requerimientos: RF08, RNF01
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Tipos ----------
interface PropsInterruptor {
  etiqueta: string
  pista?: string
  estaMarcado: boolean
  alCambiar: () => void
}

// ---------- Componente Interruptor ----------
/**
 * Interruptor accesible para activar o desactivar una preferencia.
 * @param props Propiedades del componente
 * @param props.etiqueta Texto visible o accesible
 * @param props.pista Explicación breve debajo de la etiqueta
 * @param props.estaMarcado Verdadero si la preferencia está activa
 * @param props.alCambiar Función que recibe el nuevo valor
 * @returns Casilla con rol switch y su etiqueta
 * @see RF08, RNF01
 */
export function Interruptor({ etiqueta, pista, estaMarcado, alCambiar }: PropsInterruptor) {
  return (
    <label className="toggle">
      <span>
        <span className="toggle__label">{etiqueta}</span>
        {pista && <span className="toggle__hint">{pista}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={estaMarcado}
        onChange={alCambiar}
        className="visually-hidden"
      />
      <span className="toggle__track" aria-hidden>
        <span className="toggle__thumb" />
      </span>
    </label>
  )
}
