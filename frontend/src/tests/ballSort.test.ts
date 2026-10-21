import { describe, expect, it } from 'vitest'
import { MAX_COLORS, MIN_COLORS, SPHERE_COLORS, SPHERE_SYMBOLS, SPHERES_PER_COLOR, tubeCount } from '../data/ballSort'
import { parseBallSortConfig } from '../games/ball-sort/config'
import { canMove, CAPACITY, generateLevel, isSolved, moveBall, solve, type Tubes } from '../games/ball-sort/logic'

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32
    return seed / 2 ** 32
  }
}

describe('tubeCount', () => {
  it('aplica T(c) = max(5, c + 2)', () => {
    expect(tubeCount(1)).toBe(5)
    expect(tubeCount(3)).toBe(5)
    expect(tubeCount(5)).toBe(7)
    expect(tubeCount(10)).toBe(12)
  })

  it('deja siempre al menos dos tubos vacíos', () => {
    for (let c = 1; c <= MAX_COLORS; c++) expect(tubeCount(c) - c).toBeGreaterThanOrEqual(2)
  })

  it('tiene un color y un símbolo distinto para cada opción', () => {
    expect(new Set(SPHERE_COLORS).size).toBe(MAX_COLORS)
    expect(new Set(SPHERE_SYMBOLS).size).toBe(MAX_COLORS)
  })
})

describe('reglas de movimiento (sección 16.4)', () => {
  // Colores: 0 y 1
  const tubes: Tubes = [[0, 1], [1], [0, 0, 0, 0, 1], [], [0, 0, 1, 1, 1]]

  it('permite mover sobre el mismo color o a un tubo vacío', () => {
    expect(canMove(tubes, 0, 1)).toBe(true)
    expect(canMove(tubes, 0, 3)).toBe(true)
  })

  it('no permite mover sobre otro color', () => {
    expect(canMove(tubes, 1, 0)).toBe(true)
    expect(canMove([[0], [1]], 0, 1)).toBe(false)
  })

  it('respeta la capacidad de cinco esferas', () => {
    expect(CAPACITY).toBe(5)
    expect(canMove(tubes, 1, 2)).toBe(false)
    expect(canMove(tubes, 1, 4)).toBe(false)
  })

  it('no mueve desde un tubo vacío ni al mismo tubo', () => {
    expect(canMove(tubes, 3, 0)).toBe(false)
    expect(canMove(tubes, 0, 0)).toBe(false)
  })

  it('solo mueve la esfera superior y actualiza ambos tubos', () => {
    const next = moveBall(tubes, 0, 1)
    expect(next[0]).toEqual([0])
    expect(next[1]).toEqual([1, 1])
    expect(tubes[0]).toEqual([0, 1])
    expect(() => moveBall(tubes, 3, 0)).toThrow()
  })

  it('el nivel se completa cuando cada tubo ocupado tiene un solo color', () => {
    expect(isSolved([[0, 0, 0, 0, 0], [], [1, 1, 1, 1, 1]])).toBe(true)
    expect(isSolved([[0, 0, 0, 0, 1], [], [1, 1, 1, 1, 0]])).toBe(false)
    expect(isSolved([[0, 0, 0], [0, 0], []])).toBe(false)
  })
})

describe('generador de niveles (sección 7.4)', () => {
  for (let colors = MIN_COLORS; colors <= MAX_COLORS; colors++) {
    it(`con ${colors} ${colors === 1 ? 'color' : 'colores'} crea niveles resolubles y no resueltos`, () => {
      const random = seeded(colors * 97)
      for (let i = 0; i < 5; i++) {
        const level = generateLevel(colors, random)
        // Número de tubos y esferas según la configuración
        expect(level).toHaveLength(tubeCount(colors))
        const balls = level.flat()
        expect(balls).toHaveLength(colors * SPHERES_PER_COLOR)
        for (let c = 0; c < colors; c++) expect(balls.filter((b) => b === c)).toHaveLength(SPHERES_PER_COLOR)
        expect(level.every((t) => t.length <= CAPACITY)).toBe(true)
        expect(isSolved(level)).toBe(false)

        // La solución encontrada solo usa movimientos legales y termina en el estado resuelto
        const solution = solve(level, 200_000)
        expect(solution).not.toBeNull()
        let state = level
        for (const [from, to] of solution!) {
          expect(canMove(state, from, to)).toBe(true)
          state = moveBall(state, from, to)
        }
        expect(isSolved(state)).toBe(true)
      }
    })
  }

  it('el solucionador reconoce un nivel sin solución', () => {
    // Dos tubos llenos y mezclados sin espacio libre
    expect(solve([[0, 1, 0, 1, 0], [1, 0, 1, 0, 1]])).toBeNull()
  })
})

describe('configuración de esferas', () => {
  it('acepta de 1 a 10 colores', () => {
    expect(parseBallSortConfig(new URLSearchParams('colores=4'))).toEqual({ colors: 4 })
    expect(parseBallSortConfig(new URLSearchParams('colores=0'))).toBeNull()
    expect(parseBallSortConfig(new URLSearchParams('colores=11'))).toBeNull()
    expect(parseBallSortConfig(new URLSearchParams('colores=2.5'))).toBeNull()
    expect(parseBallSortConfig(new URLSearchParams(''))).toBeNull()
  })
})
