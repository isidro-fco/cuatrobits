/**
 * Archivo: Fondo.tsx
 * Módulo: frontend / components
 * Descripción: Fondo abstracto con manchas de color y mosaicos de píxeles; puede animarse para el
 *              protector de pantalla.
 * Requerimientos: RNF04, RNF08
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Componente Fondo ----------
// Fondo abstracto: manchas de color y mosaicos de píxeles en los márgenes (prototipo A7).
// `esAnimado` hace que las figuras se muevan (protector de pantalla).
/**
 * Fondo abstracto con manchas de color y mosaicos de píxeles en los márgenes.
 * @param props Propiedades del componente
 * @param props.esAnimado Verdadero para que las figuras se muevan (protector de pantalla)
 * @returns Capa decorativa oculta para los lectores de pantalla
 * @see RNF04, RNF08
 */
export function Fondo({ esAnimado = false }: { esAnimado?: boolean }) {
  return (
    <div className={esAnimado ? 'background background--animated' : 'background'} aria-hidden>
      <span className="blob blob--blue" />
      <span className="blob blob--lilac" />
      <span className="blob blob--mint" />
      <span className="blob blob--yellow" />
      <span className="pixels pixels--left">
        {Array.from({ length: 10 }, (_, i) => (
          <i key={i} />
        ))}
      </span>
      <span className="pixels pixels--right">
        {Array.from({ length: 10 }, (_, i) => (
          <i key={i} />
        ))}
      </span>
    </div>
  )
}
