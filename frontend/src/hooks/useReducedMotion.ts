import { useSyncExternalStore } from 'react'
import { useSettingsStore } from '../stores/settingsStore'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(callback: () => void) {
  const media = window.matchMedia(QUERY)
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}

/** Verdadero si el jugador o el sistema piden reducir animaciones */
export function useReducedMotion(): boolean {
  const fromSettings = useSettingsStore((s) => s.reducedMotion)
  const fromSystem = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  )
  return fromSettings || fromSystem
}
