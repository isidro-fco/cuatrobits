import type { GlyphName } from './pixelGlyphs'

export interface AchievementInfo {
  id: string
  name: string
  description: string
  icon: GlyphName
  background: string
}

// Debe coincidir con database/seeds/001_logros.sql
export const ACHIEVEMENTS: AchievementInfo[] = [
  { id: 'first-game', name: 'Primera partida', description: 'Completa tu primera partida.', icon: 'star', background: 'var(--yellow-soft)' },
  { id: 'first-win', name: 'Primera victoria', description: 'Gana tu primera partida.', icon: 'diamond', background: 'var(--blue-soft)' },
  { id: 'five-games', name: 'Jugador constante', description: 'Completa cinco partidas.', icon: 'triangle', background: 'var(--orange-soft)' },
  { id: 'win-each-game', name: 'Gran explorador', description: 'Gana al menos una vez en cada juego.', icon: 'diamondOutline', background: 'var(--orange-soft)' },
  { id: 'bitbot-10', name: 'Constructor experto', description: 'Adivina diez palabras en Arma a BitBot.', icon: 'grid', background: 'var(--mint-soft)' },
  { id: 'ball-sort-5', name: 'Maestro de las esferas', description: 'Completa cinco niveles de esferas.', icon: 'circle', background: 'var(--mint-soft)' },
  { id: 'memory-10', name: 'Memoria brillante', description: 'Encuentra diez parejas en Memorama.', icon: 'squareInSquare', background: 'var(--lilac-soft)' },
]
