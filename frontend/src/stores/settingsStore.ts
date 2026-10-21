import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Settings } from '../types'

interface SettingsState extends Settings {
  toggle: (key: keyof Settings) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      music: true,
      sfx: true,
      reducedMotion: false,
      showTimer: true,
      toggle: (key) => set((s) => ({ [key]: !s[key] })),
    }),
    { name: 'cuatrobits-settings', version: 1 },
  ),
)
