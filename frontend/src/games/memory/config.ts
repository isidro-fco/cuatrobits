import { CATEGORIES, MEMORY_DIFFICULTIES, type MemoryDifficulty } from '../../data/categories'
import type { CategoryId } from '../../types'

export interface MemoryConfig {
  category: CategoryId
  difficulty: MemoryDifficulty
}

export function parseMemoryConfig(params: URLSearchParams): MemoryConfig | null {
  const category = CATEGORIES.find((c) => c.id === params.get('categoria'))
  const difficulty = MEMORY_DIFFICULTIES.find((d) => d.id === params.get('dificultad'))
  if (!category || !difficulty) return null
  return { category: category.id, difficulty: difficulty.id }
}
