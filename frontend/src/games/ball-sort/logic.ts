// Reglas, generador y solucionador de Ordenamiento de esferas (secciones 7.2 a 7.4)
import { SPHERES_PER_COLOR, tubeCount } from '../../data/ballSort'

export const CAPACITY = SPHERES_PER_COLOR

/** Cada tubo lista los colores de abajo hacia arriba */
export type Tube = number[]
export type Tubes = Tube[]
export type Move = readonly [from: number, to: number]

const top = (tube: Tube) => tube[tube.length - 1]

export function canMove(tubes: Tubes, from: number, to: number): boolean {
  if (from === to || !tubes[from] || !tubes[to]) return false
  const source = tubes[from]
  const target = tubes[to]
  if (source.length === 0 || target.length >= CAPACITY) return false
  return target.length === 0 || top(target) === top(source)
}

/** Mueve la esfera superior; lanza un error si el movimiento no es válido */
export function moveBall(tubes: Tubes, from: number, to: number): Tubes {
  if (!canMove(tubes, from, to)) throw new Error(`Movimiento no válido: ${from} → ${to}`)
  const next = tubes.map((t) => t.slice())
  next[to].push(next[from].pop()!)
  return next
}

const isComplete = (tube: Tube) => tube.length === CAPACITY && tube.every((c) => c === tube[0])

/** Resuelto: cada tubo ocupado está lleno con esferas de un solo color */
export function isSolved(tubes: Tubes): boolean {
  return tubes.every((t) => t.length === 0 || isComplete(t))
}

export function completedTubes(tubes: Tubes): number {
  return tubes.filter(isComplete).length
}

// ===== Solucionador =====

// Los tubos son intercambiables, así que el orden no importa para identificar un estado
const stateKey = (tubes: Tubes) =>
  tubes
    .map((t) => t.join(','))
    .sort()
    .join('|')

function candidateMoves(tubes: Tubes): Move[] {
  const moves: { move: Move; priority: number }[] = []
  for (let from = 0; from < tubes.length; from++) {
    const source = tubes[from]
    if (source.length === 0 || isComplete(source)) continue
    const color = top(source)
    const monochrome = source.every((c) => c === color)
    let triedEmpty = false
    for (let to = 0; to < tubes.length; to++) {
      if (!canMove(tubes, from, to)) continue
      const target = tubes[to]
      if (target.length === 0) {
        // Pasar un tubo de un solo color a uno vacío no avanza; y todos los vacíos son equivalentes
        if (monochrome || triedEmpty) continue
        triedEmpty = true
        moves.push({ move: [from, to], priority: 0 })
      } else {
        const targetMonochrome = target.every((c) => c === color)
        moves.push({ move: [from, to], priority: targetMonochrome ? 2 + target.length : 1 })
      }
    }
  }
  return moves.sort((a, b) => b.priority - a.priority).map((m) => m.move)
}

/**
 * Busca una secuencia de movimientos legales hasta el estado resuelto (búsqueda en profundidad
 * con memoria de estados visitados). Devuelve `null` si no la encuentra dentro del límite.
 */
export function solve(tubes: Tubes, maxStates = 50_000): Move[] | null {
  const visited = new Set<string>()
  const path: Move[] = []

  function search(state: Tubes): boolean {
    if (isSolved(state)) return true
    const key = stateKey(state)
    if (visited.has(key) || visited.size >= maxStates) return false
    visited.add(key)
    for (const move of candidateMoves(state)) {
      path.push(move)
      if (search(moveBall(state, move[0], move[1]))) return true
      path.pop()
    }
    return false
  }

  return search(tubes) ? path : null
}

// ===== Generador =====

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = items.slice()
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Mezcla aleatoria: los primeros `colors` tubos llenos y el resto vacíos */
function randomLayout(colors: number, random: () => number): Tubes {
  const balls = shuffle(
    Array.from({ length: colors * CAPACITY }, (_, i) => Math.floor(i / CAPACITY)),
    random,
  )
  return Array.from({ length: tubeCount(colors) }, (_, t) =>
    t < colors ? balls.slice(t * CAPACITY, (t + 1) * CAPACITY) : [],
  )
}

/**
 * Parte del estado ordenado y aplica movimientos inversos: cada uno corresponde a un movimiento
 * legal hacia delante, por lo que el resultado siempre tiene solución.
 */
function reverseScramble(colors: number, random: () => number, steps: number): Tubes {
  let tubes: Tubes = Array.from({ length: tubeCount(colors) }, (_, t) =>
    t < colors ? Array<number>(CAPACITY).fill(t) : [],
  )
  for (let i = 0; i < steps; i++) {
    const options: Move[] = []
    tubes.forEach((source, from) => {
      if (source.length === 0) return
      // Hacia delante, la esfera llegó a `from` sobre su mismo color o a un tubo vacío
      if (source.length > 1 && source[source.length - 2] !== top(source)) return
      tubes.forEach((target, to) => {
        if (to !== from && target.length < CAPACITY) options.push([from, to])
      })
    })
    if (options.length === 0) break
    const [from, to] = options[Math.floor(random() * options.length)]
    tubes = tubes.map((t) => t.slice())
    tubes[to].push(tubes[from].pop()!)
  }
  return tubes
}

/** Genera un nivel con solución verificada y que no empiece resuelto */
export function generateLevel(colors: number, random: () => number = Math.random): Tubes {
  // Con un solo color la mezcla aleatoria siempre queda resuelta
  if (colors > 1) {
    for (let attempt = 0; attempt < 30; attempt++) {
      const tubes = randomLayout(colors, random)
      if (!isSolved(tubes) && solve(tubes)) return tubes
    }
  }
  for (;;) {
    const tubes = reverseScramble(colors, random, colors * CAPACITY * 4)
    if (!isSolved(tubes)) return tubes
  }
}
