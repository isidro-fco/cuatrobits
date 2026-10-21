import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_BITBOT, findCosmetic, FREE_ITEMS } from '../data/cosmetics'
import type { AvatarId, Player } from '../types'
import { normalizeUsername } from '../utils/username'

interface PlayerState {
  /** Perfiles creados en este dispositivo */
  profiles: Player[]
  activeId: string | null
  /** `id` es el identificador asignado por el servidor y `authToken` el token con que se registró */
  addProfile: (username: string, avatar: AvatarId, id?: string, authToken?: string) => Player
  switchTo: (id: string) => void
  /** Suma la experiencia y los Bits de una partida; nunca resta */
  addRewards: (id: string, rewards: { xp: number; bits: number }) => void
  /** Agrega los logros que aún no tenía y devuelve solo los nuevos */
  unlockAchievements: (id: string, achievementIds: string[]) => string[]
  /** Compra un artículo de BitBot; devuelve `false` si no alcanzan los Bits o ya lo tenía */
  buyItem: (id: string, itemId: string) => boolean
  /** Usa un artículo comprado */
  equipItem: (id: string, itemId: string) => void
  /** El servidor ya registró (o descartó) estas compras */
  clearPendingItems: (id: string, itemIds: string[]) => void
  updateProfile: (
    id: string,
    changes: Partial<Pick<Player, 'registered' | 'nameConflict' | 'recoveryCode' | 'recoveryCodeSeen' | 'authToken' | 'needsRecovery'>>,
  ) => void
  /** Agrega un perfil recuperado del servidor, o actualiza el que ya estaba, y lo activa */
  restoreProfile: (player: Player) => void
  isUsernameTakenLocally: (username: string) => boolean
}

const updatePlayer = (profiles: Player[], id: string, change: (p: Player) => Player) =>
  profiles.map((p) => (p.id === id ? change(p) : p))

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      profiles: [],
      activeId: null,
      addProfile: (username, avatar, id, authToken) => {
        const player: Player = {
          id: id ?? crypto.randomUUID(),
          username: username.trim(),
          avatar,
          xp: 0,
          bits: 0,
          achievements: [],
          items: [...FREE_ITEMS],
          pendingItems: [],
          bitbot: { ...DEFAULT_BITBOT },
          createdAt: new Date().toISOString(),
          registered: id !== undefined,
          ...(authToken && { authToken }),
        }
        set((s) => ({ profiles: [...s.profiles, player], activeId: player.id }))
        return player
      },
      switchTo: (id) => set({ activeId: id }),
      addRewards: (id, { xp, bits }) =>
        set((s) => ({
          profiles: updatePlayer(s.profiles, id, (p) => ({
            ...p,
            xp: p.xp + Math.max(0, xp),
            bits: p.bits + Math.max(0, bits),
          })),
        })),
      unlockAchievements: (id, achievementIds) => {
        const player = get().profiles.find((p) => p.id === id)
        if (!player) return []
        const fresh = achievementIds.filter((a) => !player.achievements.includes(a))
        if (fresh.length > 0) {
          set((s) => ({
            profiles: updatePlayer(s.profiles, id, (p) => ({ ...p, achievements: [...p.achievements, ...fresh] })),
          }))
        }
        return fresh
      },
      buyItem: (id, itemId) => {
        const player = get().profiles.find((p) => p.id === id)
        const item = findCosmetic(itemId)
        if (!player || !item || player.items.includes(itemId) || player.bits < item.price) return false
        set((s) => ({
          profiles: updatePlayer(s.profiles, id, (p) => ({
            ...p,
            bits: p.bits - item.price,
            items: [...p.items, itemId],
            pendingItems: [...p.pendingItems, itemId],
          })),
        }))
        return true
      },
      equipItem: (id, itemId) => {
        const item = findCosmetic(itemId)
        if (!item) return
        set((s) => ({
          profiles: updatePlayer(s.profiles, id, (p) =>
            p.items.includes(itemId) ? { ...p, bitbot: { ...p.bitbot, [item.kind]: itemId } } : p,
          ),
        }))
      },
      clearPendingItems: (id, itemIds) =>
        set((s) => ({
          profiles: updatePlayer(s.profiles, id, (p) => ({
            ...p,
            pendingItems: p.pendingItems.filter((item) => !itemIds.includes(item)),
          })),
        })),
      restoreProfile: (restored) =>
        set((s) => {
          const local = s.profiles.find((p) => p.id === restored.id)
          if (!local) return { profiles: [...s.profiles, restored], activeId: restored.id }
          // Ya estaba en este dispositivo: se conserva su progreso local, que puede tener partidas pendientes
          const merged: Player = {
            ...local,
            registered: true,
            nameConflict: false,
            needsRecovery: false,
            authToken: restored.authToken,
            recoveryCode: restored.recoveryCode,
            recoveryCodeSeen: true,
            achievements: [...new Set([...local.achievements, ...restored.achievements])],
            items: [...new Set([...local.items, ...restored.items])],
          }
          return { profiles: updatePlayer(s.profiles, restored.id, () => merged), activeId: restored.id }
        }),
      updateProfile: (id, changes) => set((s) => ({ profiles: updatePlayer(s.profiles, id, (p) => ({ ...p, ...changes })) })),
      isUsernameTakenLocally: (username) => {
        const normalized = normalizeUsername(username)
        return get().profiles.some((p) => normalizeUsername(p.username) === normalized)
      },
    }),
    {
      name: 'cuatrobits-players',
      version: 2,
      // Versión 2 (etapa 4): artículos y apariencia de BitBot
      migrate: (persisted, version) => {
        const state = persisted as { profiles: Player[]; activeId: string | null }
        if (version < 2) {
          state.profiles = state.profiles.map((p) => ({
            ...p,
            items: p.items ?? [...FREE_ITEMS],
            pendingItems: p.pendingItems ?? [],
            bitbot: p.bitbot ?? { ...DEFAULT_BITBOT },
          }))
        }
        return state as PlayerState
      },
    },
  ),
)

export function useActivePlayer(): Player | null {
  return usePlayerStore((s) => s.profiles.find((p) => p.id === s.activeId) ?? null)
}
