/**
 * Archivo: useMovimientoReducido.ts
 * Módulo: frontend / hooks
 * Descripción: Hook que combina la preferencia de la aplicación con la del sistema para reducir
 *              animaciones.
 * Requerimientos: RF08, RNF04
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { useSyncExternalStore } from 'react'

// ---------- Módulos internos ----------
import { useAjustesStore } from '../stores/useAjustesStore'

// ---------- Constantes ----------
/** Consulta de medios con la preferencia del sistema */
const CONSULTA_MOVIMIENTO_REDUCIDO = '(prefers-reduced-motion: reduce)'

// ---------- Hook useMovimientoReducido ----------
function suscribir(funcionRetorno: () => void) {
  const consultaMedios = window.matchMedia(CONSULTA_MOVIMIENTO_REDUCIDO)
  consultaMedios.addEventListener('change', funcionRetorno)
  return () => consultaMedios.removeEventListener('change', funcionRetorno)
}

/**
 * Verdadero si el jugador o el sistema piden reducir animaciones
 * @returns true si hay que reducir animaciones
 * @see RF08, RNF04
 */
export function useMovimientoReducido(): boolean {
  const esPorAjustes = useAjustesStore((estado) => estado.esMovimientoReducido)
  const esPorSistema = useSyncExternalStore(
    suscribir,
    () => window.matchMedia(CONSULTA_MOVIMIENTO_REDUCIDO).matches,
    () => false,
  )
  return esPorAjustes || esPorSistema
}
