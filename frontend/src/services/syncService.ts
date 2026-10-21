// Envío de partidas y compras pendientes al servidor (secciones 4.3, 9.4 y 13.4)
import { useHistoryStore } from '../stores/historyStore'
import { usePlayerStore } from '../stores/playerStore'
import { useSyncStore } from '../stores/syncStore'
import type { GameRecord, Player, SyncStatus } from '../types'
import { ApiError, apiRequest, NetworkError } from './api'
import { ensureRegistered } from './profileService'

export const SYNC_BATCH_SIZE = 100

interface SyncResponse {
  results: { id: string | null; status: 'created' | 'duplicate' | 'rejected'; error?: { code: string; message: string } }[]
}

const toPayload = ({ syncStatus: _status, syncError: _error, ...game }: GameRecord) => game

/**
 * Envía las compras de artículos. Si el servidor no las acepta (por ejemplo, porque tiene menos
 * Bits por partidas que solo existen en este dispositivo), el artículo se conserva en local.
 */
async function syncItems(playerId: string, token: string) {
  const player = usePlayerStore.getState().profiles.find((p) => p.id === playerId)
  if (!player || player.pendingItems.length === 0) return
  const done: string[] = []
  try {
    for (const itemId of player.pendingItems) {
      try {
        await apiRequest('POST', `/api/players/${playerId}/items`, { itemId }, token)
      } catch (err) {
        // Sin permiso no se descarta: se reintenta cuando el dispositivo vuelva a estar autorizado
        if (!(err instanceof ApiError) || err.status === 401 || err.status === 403) throw err
        console.warn(`El servidor no registró la compra de ${itemId}: ${err.message}`)
      }
      done.push(itemId)
    }
  } finally {
    usePlayerStore.getState().clearPendingItems(playerId, done)
  }
}

async function syncPlayer(player: Player, pending: GameRecord[], retried = false) {
  const token = await ensureRegistered(player.id)
  if (!token) return
  try {
    for (let i = 0; i < pending.length; i += SYNC_BATCH_SIZE) {
      const batch = pending.slice(i, i + SYNC_BATCH_SIZE)
      const { results } = await apiRequest<SyncResponse>(
        'POST',
        '/api/games/sync',
        { games: batch.map(toPayload) },
        token,
      )
      const updates = new Map<string, { status: SyncStatus; error?: string }>()
      results.forEach((result, index) => {
        const id = batch[index].id
        if (result.status === 'rejected') {
          // Si el jugador aún no existe en el servidor se reintentará más tarde
          if (result.error?.code !== 'not-found') updates.set(id, { status: 'rejected', error: result.error?.message })
        } else {
          updates.set(id, { status: 'synced' })
        }
      })
      useHistoryStore.getState().setSyncStatus(updates)
    }
    // Después de las partidas, para que el servidor ya tenga sus Bits
    await syncItems(player.id, token)
  } catch (err) {
    // El servidor no reconoce el token (por ejemplo, se reinició la base de datos): se registra otra vez, una sola
    if (retried || !(err instanceof ApiError && err.status === 401)) throw err
    usePlayerStore.getState().updateProfile(player.id, { registered: false })
    const stillPending = useHistoryStore
      .getState()
      .records.filter((r) => r.playerId === player.id && r.syncStatus === 'pending')
    await syncPlayer(player, stillPending, true)
  }
}

async function runSync() {
  const pending = useHistoryStore.getState().records.filter((r) => r.syncStatus === 'pending')
  const players = usePlayerStore
    .getState()
    .profiles.filter((p) => p.pendingItems.length > 0 || pending.some((r) => r.playerId === p.id))
  if (players.length === 0) return
  const sync = useSyncStore.getState()
  sync.set({ state: 'syncing' })
  try {
    for (const player of players) {
      await syncPlayer(player, pending.filter((r) => r.playerId === player.id))
    }
    sync.set({ state: 'idle', lastSyncedAt: new Date().toISOString() })
  } catch (err) {
    sync.set({ state: err instanceof NetworkError ? 'offline' : 'idle' })
    if (!(err instanceof NetworkError)) console.error('Error al sincronizar', err)
  }
}

let running: Promise<void> | null = null
let rerun = false

/**
 * Envía todas las partidas y compras pendientes. Si ya hay una sincronización en curso, se repite al terminar
 * para incluir las partidas nuevas. Sin conexión, las partidas quedan pendientes para otro intento.
 */
export function syncPendingGames(): Promise<void> {
  if (running) {
    rerun = true
    return running
  }
  running = runSync().finally(() => {
    running = null
    if (rerun) {
      rerun = false
      void syncPendingGames()
    }
  })
  return running
}
