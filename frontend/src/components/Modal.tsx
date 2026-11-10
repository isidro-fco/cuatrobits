/**
 * Archivo: Modal.tsx
 * Módulo: frontend / components
 * Descripción: Ventana modal accesible que atrapa el foco y se cierra con Escape.
 * Requerimientos: RNF01, RNF07
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { useEffect, useRef, type ReactNode } from 'react'

// ---------- Tipos ----------
interface PropsModal {
  estaAbierto: boolean
  alCerrar: () => void
  etiquetadoPor: string
  children: ReactNode
  tamano?: 'medium' | 'large'
}

// ---------- Componente Modal ----------
// Usa <dialog> nativo: atrapa el foco y se cierra con Escape.
/**
 * Ventana modal accesible: atrapa el foco, se cierra con Escape o al tocar fuera de ella.
 * @param props Propiedades del componente
 * @param props.estaAbierto Verdadero para mostrar la ventana
 * @param props.alCerrar Función que se llama al pedir cerrar
 * @param props.etiquetadoPor Id del título que nombra la ventana
 * @param props.children Contenido de la ventana
 * @param props.tamano Ancho de la ventana
 * @returns Elemento dialog nativo; su contenido solo se monta mientras está abierto
 * @see RNF01, RNF07
 */
export function Modal({
  estaAbierto,
  alCerrar,
  etiquetadoPor,
  children,
  tamano = 'medium',
}: PropsModal) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) {
      return
    }
    if (estaAbierto && !dialogo.open) {
      dialogo.showModal()
    }
    if (!estaAbierto && dialogo.open) {
      dialogo.close()
    }
  }, [estaAbierto])

  return (
    <dialog
      ref={ref}
      className={`modal modal--${tamano}`}
      aria-labelledby={etiquetadoPor}
      onCancel={(evento) => {
        evento.preventDefault()
        alCerrar()
      }}
      onClick={(evento) => {
        if (evento.target === ref.current) {
          alCerrar()
        }
      }}
    >
      {estaAbierto && children}
    </dialog>
  )
}
