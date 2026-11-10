/**
 * Archivo: useInactividad.ts
 * Módulo: frontend / hooks
 * Descripción: Hook que indica cuándo el jugador lleva un tiempo sin interactuar.
 * Requerimientos: RNF07
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { useEffect, useState } from 'react'

// ---------- Constantes ----------
/** Eventos del navegador que cuentan como actividad del jugador */
const EVENTOS_ACTIVIDAD = [
  'pointerdown',
  'pointermove',
  'keydown',
  'wheel',
  'touchstart',
  'scroll',
] as const

// ---------- Hook useInactividad ----------
/**
 * Verdadero cuando pasan `milisegundos` milisegundos sin que el jugador toque, mueva el puntero o
 * use el teclado. Con `estaHabilitado` en falso nunca se activa. `despertar` vuelve al estado
 * activo y reinicia la cuenta.
 * @param milisegundos Tiempo sin actividad antes de activarse
 * @param estaHabilitado Falso para no activarse nunca
 * @returns estaInactivo y la función despertar
 * @see RNF07
 */
export function useInactividad(
  milisegundos: number,
  estaHabilitado: boolean,
): { estaInactivo: boolean; despertar: () => void } {
  // Verdadero cuando se cumplió el tiempo sin actividad
  const [estaInactivo, asignarEstaInactivo] = useState(false)
  // Cambia al despertar para reiniciar la cuenta del tiempo
  const [ronda, asignarRonda] = useState(0)

  useEffect(() => {
    if (!estaHabilitado || estaInactivo) {
      return
    }
    let temporizador = window.setTimeout(() => asignarEstaInactivo(true), milisegundos)
    const reiniciar = () => {
      window.clearTimeout(temporizador)
      temporizador = window.setTimeout(() => asignarEstaInactivo(true), milisegundos)
    }
    for (const evento of EVENTOS_ACTIVIDAD) {
      window.addEventListener(evento, reiniciar, { capture: true, passive: true })
    }
    return () => {
      window.clearTimeout(temporizador)
      for (const evento of EVENTOS_ACTIVIDAD) {
        window.removeEventListener(evento, reiniciar, { capture: true })
      }
    }
  }, [milisegundos, estaHabilitado, estaInactivo, ronda])

  return {
    estaInactivo: estaHabilitado && estaInactivo,
    despertar: () => {
      asignarEstaInactivo(false)
      asignarRonda((rondaAnterior) => rondaAnterior + 1)
    },
  }
}
