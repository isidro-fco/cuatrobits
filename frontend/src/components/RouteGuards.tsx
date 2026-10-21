import { useEffect } from 'react'
import { Navigate, Outlet, useSearchParams } from 'react-router'
import { useAutoSync } from '../hooks/useAutoSync'
import { RegisterPage } from '../pages/RegisterPage'
import { checkAchievements } from '../services/achievementService'
import { installAudioUnlock, setMusicEnabled } from '../services/audio'
import { useActivePlayer, usePlayerStore } from '../stores/playerStore'
import { useSettingsStore } from '../stores/settingsStore'

/** Aplica las preferencias globales, el audio y los logros pendientes, y mantiene la sincronización */
export function Root() {
  const reducedMotion = useSettingsStore((s) => s.reducedMotion)
  const music = useSettingsStore((s) => s.music)
  const activeId = usePlayerStore((s) => s.activeId)
  useAutoSync()

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(reducedMotion)
  }, [reducedMotion])

  useEffect(() => installAudioUnlock(), [])
  useEffect(() => setMusicEnabled(music), [music])

  // Los perfiles con partidas anteriores a la etapa 4 reciben los logros que ya cumplían
  useEffect(() => {
    if (activeId) checkAchievements(activeId)
  }, [activeId])

  return <Outlet />
}

/** Las pantallas del juego requieren un perfil activo */
export function RequirePlayer() {
  const player = useActivePlayer()
  return player ? <Outlet /> : <Navigate to="/registro" replace />
}

/** El registro solo se muestra sin perfil activo, o al crear otro jugador */
export function RegisterRoute() {
  const player = useActivePlayer()
  const [params] = useSearchParams()
  if (player && params.get('nuevo') !== '1') return <Navigate to="/" replace />
  return <RegisterPage />
}
