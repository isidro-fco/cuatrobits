import type { CategoryId, Difficulty } from '../types'

export interface CategoryInfo {
  id: CategoryId
  name: string
  emoji: string
  background: string
  /** Dificultad de Arma a BitBot a la que pertenece la categoría (sección 6.2) */
  bitbotDifficulty: Difficulty
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'animals', name: 'Animales', emoji: '🐶', background: 'var(--blue-soft)', bitbotDifficulty: 'easy' },
  { id: 'colors', name: 'Colores', emoji: '🎨', background: 'var(--yellow-soft)', bitbotDifficulty: 'easy' },
  { id: 'fruits', name: 'Frutas', emoji: '🍎', background: 'var(--orange-soft)', bitbotDifficulty: 'easy' },
  { id: 'school', name: 'Escuela', emoji: '✏️', background: 'var(--lilac-soft)', bitbotDifficulty: 'medium' },
  { id: 'transport', name: 'Transportes', emoji: '🚲', background: 'var(--mint-soft)', bitbotDifficulty: 'medium' },
  { id: 'nature', name: 'Naturaleza', emoji: '🌳', background: 'var(--yellow-soft)', bitbotDifficulty: 'medium' },
  { id: 'space', name: 'Espacio', emoji: '🚀', background: 'var(--lilac-soft)', bitbotDifficulty: 'hard' },
  { id: 'technology', name: 'Tecnología', emoji: '💻', background: 'var(--blue-soft)', bitbotDifficulty: 'hard' },
]

export interface DifficultyOption<T extends string> {
  id: T
  name: string
  description: string
  color: string
}

export const BITBOT_DIFFICULTIES: DifficultyOption<Difficulty>[] = [
  { id: 'easy', name: 'Fácil', description: 'Para comenzar', color: 'var(--mint)' },
  { id: 'medium', name: 'Medio', description: 'Un reto equilibrado', color: 'var(--blue)' },
  { id: 'hard', name: 'Difícil', description: 'Pon a prueba tus habilidades', color: 'var(--orange)' },
]

export type MemoryDifficulty = 'easy' | 'normal' | 'hard' | 'expert'

export const MEMORY_DIFFICULTIES: (DifficultyOption<MemoryDifficulty> & { cols: number; rows: number })[] = [
  { id: 'easy', name: 'Fácil', description: '4 parejas · 4 × 2', color: 'var(--mint)', cols: 4, rows: 2 },
  { id: 'normal', name: 'Normal', description: '8 parejas · 4 × 4', color: 'var(--blue)', cols: 4, rows: 4 },
  { id: 'hard', name: 'Difícil', description: '12 parejas · 6 × 4', color: 'var(--orange)', cols: 6, rows: 4 },
  { id: 'expert', name: 'Experto', description: '18 parejas · 6 × 6', color: 'var(--lilac)', cols: 6, rows: 6 },
]
