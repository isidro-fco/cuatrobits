import { CATEGORIES } from '../../data/categories'
import type { CategoryId, Difficulty } from '../../types'

export interface BitBotConfig {
  category: CategoryId
  difficulty: Difficulty
}

/** Lee la configuración de la URL; la categoría debe pertenecer a la dificultad (sección 6.2) */
export function parseBitBotConfig(params: URLSearchParams): BitBotConfig | null {
  const category = CATEGORIES.find((c) => c.id === params.get('categoria'))
  const difficulty = params.get('dificultad')
  if (!category || category.bitbotDifficulty !== difficulty) return null
  return { category: category.id, difficulty: category.bitbotDifficulty }
}
