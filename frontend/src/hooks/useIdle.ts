import { useEffect, useState } from 'react'

const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart', 'scroll'] as const

/**
 * Verdadero cuando pasan `ms` milisegundos sin que el jugador toque, mueva el puntero o use el teclado.
 * Con `enabled` en falso nunca se activa. `wake` vuelve al estado activo y reinicia la cuenta.
 */
export function useIdle(ms: number, enabled: boolean): { idle: boolean; wake: () => void } {
  const [idle, setIdle] = useState(false)
  const [round, setRound] = useState(0)

  useEffect(() => {
    if (!enabled || idle) return
    let timer = window.setTimeout(() => setIdle(true), ms)
    const restart = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setIdle(true), ms)
    }
    for (const event of ACTIVITY_EVENTS) window.addEventListener(event, restart, { capture: true, passive: true })
    return () => {
      window.clearTimeout(timer)
      for (const event of ACTIVITY_EVENTS) window.removeEventListener(event, restart, { capture: true })
    }
  }, [ms, enabled, idle, round])

  return {
    idle: enabled && idle,
    wake: () => {
      setIdle(false)
      setRound((r) => r + 1)
    },
  }
}
