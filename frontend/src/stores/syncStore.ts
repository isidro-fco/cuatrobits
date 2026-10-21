import { create } from 'zustand'

export type SyncState = 'idle' | 'syncing' | 'offline'

interface SyncStoreState {
  state: SyncState
  lastSyncedAt: string | null
  set: (changes: Partial<Pick<SyncStoreState, 'state' | 'lastSyncedAt'>>) => void
}

// Estado de la conexión con el servidor; no se guarda en localStorage
export const useSyncStore = create<SyncStoreState>()((set) => ({
  state: 'idle',
  lastSyncedAt: null,
  set: (changes) => set(changes),
}))
