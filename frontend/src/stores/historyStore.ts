import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameRecord, SyncStatus } from '../types'

interface HistoryState {
  records: GameRecord[]
  addRecord: (record: GameRecord) => void
  /** Agrega las partidas recuperadas que no estén ya en el historial */
  mergeRecords: (records: GameRecord[]) => void
  setSyncStatus: (updates: Map<string, { status: SyncStatus; error?: string }>) => void
}

// Historial local. Cada partida se guarda aquí primero y después se sincroniza (sección 4.3).
export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      records: [],
      addRecord: (record) => set((s) => ({ records: [record, ...s.records] })),
      mergeRecords: (incoming) =>
        set((s) => {
          const known = new Set(s.records.map((r) => r.id))
          const fresh = incoming.filter((r) => !known.has(r.id))
          if (fresh.length === 0) return s
          return { records: [...s.records, ...fresh].sort((a, b) => b.playedAt.localeCompare(a.playedAt)) }
        }),
      setSyncStatus: (updates) =>
        set((s) => ({
          records: s.records.map((r) => {
            const update = updates.get(r.id)
            return update ? { ...r, syncStatus: update.status, syncError: update.error } : r
          }),
        })),
    }),
    { name: 'cuatrobits-history', version: 1 },
  ),
)
