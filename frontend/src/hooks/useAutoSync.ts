import { useEffect } from 'react'
import { syncPendingGames } from '../services/syncService'
import { useHistoryStore } from '../stores/historyStore'
import { usePlayerStore } from '../stores/playerStore'

const RETRY_MS = 60_000

/** Sincroniza al abrir la app, al terminar una partida o comprar, al recuperar la conexión y cada minuto */
export function useAutoSync() {
  const pendingGames = useHistoryStore((s) => s.records.filter((r) => r.syncStatus === 'pending').length)
  const pendingItems = usePlayerStore((s) => s.profiles.reduce((n, p) => n + p.pendingItems.length, 0))

  useEffect(() => {
    if (pendingGames > 0 || pendingItems > 0) void syncPendingGames()
  }, [pendingGames, pendingItems])

  useEffect(() => {
    const sync = () => void syncPendingGames()
    window.addEventListener('online', sync)
    const id = window.setInterval(sync, RETRY_MS)
    return () => {
      window.removeEventListener('online', sync)
      window.clearInterval(id)
    }
  }, [])
}
