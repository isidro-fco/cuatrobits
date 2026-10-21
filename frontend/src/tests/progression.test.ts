import { describe, expect, it } from 'vitest'
import { levelFromXp, xpForNextLevel } from '../utils/progression'

describe('levelFromXp', () => {
  it('empieza en el nivel 1 sin experiencia', () => {
    expect(levelFromXp(0)).toEqual({ level: 1, current: 0, required: xpForNextLevel(1) })
  })

  it('sube de nivel al alcanzar la XP requerida', () => {
    expect(levelFromXp(xpForNextLevel(1)).level).toBe(2)
    expect(levelFromXp(xpForNextLevel(1) - 1).level).toBe(1)
  })

  it('conserva la XP sobrante dentro del nivel', () => {
    const total = xpForNextLevel(1) + xpForNextLevel(2) + 30
    expect(levelFromXp(total)).toEqual({ level: 3, current: 30, required: xpForNextLevel(3) })
  })

  it('trata la XP negativa como cero', () => {
    expect(levelFromXp(-50).level).toBe(1)
  })
})
