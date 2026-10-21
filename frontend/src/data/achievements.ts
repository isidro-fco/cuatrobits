export interface AchievementInfo {
  id: string
  name: string
  description: string
  icon: string
  background: string
}

// Debe coincidir con database/seeds/001_logros.sql
export const ACHIEVEMENTS: AchievementInfo[] = [
  { id: 'first-game', name: 'Primera partida', description: 'Completa tu primera partida.', icon: '★', background: 'var(--yellow-soft)' },
  { id: 'first-win', name: 'Primera victoria', description: 'Gana tu primera partida.', icon: '◆', background: 'var(--blue-soft)' },
  { id: 'five-games', name: 'Jugador constante', description: 'Completa cinco partidas.', icon: '▲', background: 'var(--orange-soft)' },
  { id: 'win-each-game', name: 'Gran explorador', description: 'Gana al menos una vez en cada juego.', icon: '◇', background: 'var(--orange-soft)' },
  { id: 'bitbot-10', name: 'Constructor experto', description: 'Adivina diez palabras en Arma a BitBot.', icon: '▦', background: 'var(--mint-soft)' },
  { id: 'ball-sort-5', name: 'Maestro de las esferas', description: 'Completa cinco niveles de esferas.', icon: '●', background: 'var(--mint-soft)' },
  { id: 'memory-10', name: 'Memoria brillante', description: 'Encuentra diez parejas en Memorama.', icon: '▣', background: 'var(--lilac-soft)' },
]
