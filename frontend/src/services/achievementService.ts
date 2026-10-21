// Desbloqueo de logros a partir del historial local (sección 9.3).
// El servidor repite la misma evaluación con las partidas sincronizadas.
import { ACHIEVEMENTS, type AchievementInfo } from '../data/achievements'
import { useHistoryStore } from '../stores/historyStore'
import { usePlayerStore } from '../stores/playerStore'
import { evaluateAchievements, summarizeGames } from '../utils/achievements'

/** Desbloquea los logros que el jugador ya cumple y devuelve solo los nuevos */
export function checkAchievements(playerId: string): AchievementInfo[] {
  const records = useHistoryStore.getState().records.filter((r) => r.playerId === playerId)
  const fresh = usePlayerStore.getState().unlockAchievements(playerId, evaluateAchievements(summarizeGames(records)))
  return ACHIEVEMENTS.filter((a) => fresh.includes(a.id))
}
