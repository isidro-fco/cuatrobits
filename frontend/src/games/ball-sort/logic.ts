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

/** Un nivel y una secuencia de movimientos legales que lo resuelve */
export interface Level {
  tubes: Tubes
  solution: Move[]
}

/** Estado ordenado: los primeros `colors` tubos llenos de un solo color y el resto vacíos */
function sortedTubes(colors: number): Tubes {
  return Array.from({ length: tubeCount(colors) }, (_, t) => (t < colors ? Array<number>(CAPACITY).fill(t) : []))
}

/**
 * Movimientos inversos posibles: llevar la esfera de arriba de `from` a `to` de modo que, hacia
 * delante, volver de `to` a `from` sea un movimiento legal. Para eso la esfera debe estar sola en
 * su tubo o sobre otra de su mismo color.
 */
function reverseMoves(tubes: Tubes): Move[] {
  const moves: Move[] = []
  tubes.forEach((source, from) => {
    if (source.length === 0) return
    if (source.length > 1 && source[source.length - 2] !== top(source)) return
    tubes.forEach((target, to) => {
      if (to !== from && target.length < CAPACITY) moves.push([from, to])
    })
  })
  return moves
}

/** Qué tan revuelto está: esferas sobre otro color, tubos incompletos y, en contra, tubos ya completos */
function disorder(tubes: Tubes): number {
  let score = 0
  for (const tube of tubes) {
    for (let i = 1; i < tube.length; i++) if (tube[i] !== tube[i - 1]) score += 3
    if (tube.length > 0 && !isComplete(tube)) score += 1
    if (isComplete(tube)) score -= 5
  }
  return score
}

/** Comprueba que la secuencia solo use movimientos legales y termine con las esferas ordenadas */
export function verifySolution(tubes: Tubes, solution: readonly Move[]): boolean {
  let state = tubes
  for (const [from, to] of solution) {
    if (!canMove(state, from, to)) return false
    state = moveBall(state, from, to)
  }
  return isSolved(state)
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = items.slice()
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Revuelve todas las esferas del estado ordenado y las reparte en los primeros tubos */
function shuffledTubes(colors: number, random: () => number): Tubes {
  const balls = shuffle(sortedTubes(colors).flat(), random)
  return Array.from({ length: tubeCount(colors) }, (_, t) =>
    t < colors ? balls.slice(t * CAPACITY, (t + 1) * CAPACITY) : [],
  )
}

/**
 * Respaldo que siempre tiene solución: revuelve con movimientos inversos al azar, de modo que
 * recorrerlos al revés devuelve las esferas a su lugar. Queda menos revuelto que `shuffledTubes`.
 */
function reverseScramble(colors: number, random: () => number): Level | null {
  let tubes = sortedTubes(colors)
  const scramble: Move[] = []
  let best: { tubes: Tubes; length: number; score: number } | null = null
  for (let i = 0; i < 100 + colors * 80; i++) {
    const last = scramble.at(-1)
    // Deshacer el movimiento anterior no revuelve nada
    const options = reverseMoves(tubes).filter((m) => !last || m[0] !== last[1] || m[1] !== last[0])
    if (options.length === 0) break
    const [from, to] = options[Math.floor(random() * options.length)]
    tubes = tubes.map((t) => t.slice())
    tubes[to].push(tubes[from].pop()!)
    scramble.push([from, to])
    const score = disorder(tubes)
    if (!isSolved(tubes) && (!best || score > best.score)) best = { tubes, length: scramble.length, score }
  }
  if (!best) return null
  const solution = scramble
    .slice(0, best.length)
    .reverse()
    .map(([from, to]): Move => [to, from])
  return { tubes: best.tubes, solution }
}

/**
 * Genera un nivel que siempre se puede terminar (sección 7.4). Parte de las esferas ordenadas,
 * las revuelve y busca una secuencia de movimientos legales que las vuelva a ordenar; antes de
 * entregar el nivel juega esa secuencia para verificarla. Si no la encuentra, prueba otra mezcla
 * y, como último recurso, usa `reverseScramble`.
 */
export function generateLevelWithSolution(colors: number, random: () => number = Math.random): Level {
  // Con un solo color, repartir las esferas al azar siempre las deja en un tubo: no hay mezcla posible
  if (colors > 1) {
    for (let attempt = 0; attempt < 30; attempt++) {
      const tubes = shuffledTubes(colors, random)
      if (isSolved(tubes) || completedTubes(tubes) > 0) continue
      const solution = solve(tubes)
      if (solution && verifySolution(tubes, solution)) return { tubes, solution }
    }
  }
  for (let attempt = 0; attempt < 10; attempt++) {
    const level = reverseScramble(colors, random)
    if (level && verifySolution(level.tubes, level.solution)) return level
  }
  // Con un azar que siempre devuelve lo mismo puede no haber mezcla: una esfera fuera de su tubo
  const tubes = sortedTubes(colors)
  tubes[colors].push(tubes[0].pop()!)
  return { tubes, solution: [[colors, 0]] }
}

/** Genera un nivel con solución verificada y que no empiece resuelto */
export function generateLevel(colors: number, random: () => number = Math.random): Tubes {
  return generateLevelWithSolution(colors, random).tubes
}
