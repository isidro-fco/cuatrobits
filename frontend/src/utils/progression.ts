// Módulo compartido de niveles (sección 9.2): la tabla puede ajustarse aquí sin tocar los juegos.

/** XP necesaria para pasar del nivel `level` al siguiente */
export function xpForNextLevel(level: number): number {
  return 100 + (level - 1) * 50
}

export interface LevelProgress {
  level: number
  /** XP acumulada dentro del nivel actual */
  current: number
  /** XP necesaria para subir al siguiente nivel */
  required: number
}

export function levelFromXp(totalXp: number): LevelProgress {
  let level = 1
  let remaining = Math.max(0, Math.floor(totalXp))
  while (remaining >= xpForNextLevel(level)) {
    remaining -= xpForNextLevel(level)
    level++
  }
  return { level, current: remaining, required: xpForNextLevel(level) }
}
