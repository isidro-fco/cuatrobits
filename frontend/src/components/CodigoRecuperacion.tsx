/**
 * Archivo: CodigoRecuperacion.tsx
 * Módulo: frontend / components
 * Descripción: Muestra el código secreto con letras grandes y fáciles de copiar.
 * Requerimientos: RNF01, RNF12
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Componente CodigoRecuperacion ----------
/**
 * Muestra el código secreto con letras grandes y fáciles de copiar.
 * @param props Propiedades del componente
 * @param props.codigo Código secreto de recuperación
 * @returns Código en letras grandes
 * @see RNF01, RNF12
 */
export function CodigoRecuperacion({ codigo }: { codigo: string }) {
  return (
    <p className="recovery-code" aria-label={`Código secreto: ${[...codigo].join(' ')}`}>
      {codigo}
    </p>
  )
}
