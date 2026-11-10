/**
 * Archivo: iaMinimax.ts
 * Módulo: frontend / games / conecta4
 * Descripción: IA de Conecta 4: Minimax con poda alfa-beta (sección 5.5).
 * Requerimientos: RF19, RF20, RE01
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import {
  aplicarMovimiento,
  COLUMNAS,
  FICHAS_PARA_GANAR,
  type Tablero,
  type Ficha,
  estaTableroLleno,
  esCeldaGanadora,
  FILAS,
  movimientosValidos,
} from './logicaConecta4'

// ---------- Tipos ----------
export type DificultadIA = 'easy' | 'normal' | 'hard'

interface ParametrosIA {
  /** Profundidad de búsqueda en medios turnos */
  profundidad: number
  /** Probabilidad de elegir una jugada al azar en lugar de la mejor */
  tasaErrores: number
  /** Peso de la evaluación posicional (ventanas y centro) */
  esPosicional: boolean
}

// ---------- Constantes ----------
// La dificultad solo cambia parámetros de búsqueda y evaluación
export const PARAMETROS_IA: Record<DificultadIA, ParametrosIA> = {
  easy: { profundidad: 2, tasaErrores: 0.35, esPosicional: false },
  normal: { profundidad: 4, tasaErrores: 0, esPosicional: true },
  hard: { profundidad: 6, tasaErrores: 0, esPosicional: true },
}

/** Puntuación de una victoria; mayor que cualquier evaluación heurística */
const PUNTAJE_VICTORIA = 1_000_000
// Explorar primero el centro mejora la poda
const ORDEN_COLUMNAS = [3, 2, 4, 1, 5, 0, 6].filter((columna) => columna < COLUMNAS)

// ---------- Funciones ----------
function puntuarVentana(celdas: (Ficha | null)[], yo: Ficha): number {
  let propios = 0
  let ajenos = 0
  for (const celda of celdas) {
    if (celda === yo) {
      propios++
    } else if (celda !== null) {
      ajenos++
    }
  }
  if (propios > 0 && ajenos > 0) {
    return 0
  }
  if (propios === 3) {
    return 6
  }
  if (propios === 2) {
    return 2
  }
  if (ajenos === 3) {
    return -8
  }
  if (ajenos === 2) {
    return -2
  }
  return 0
}

/**
 * Evaluación heurística de una posición no terminal desde el punto de vista de `yo`
 * @param tablero Tablero de Conecta 4
 * @param yo Ficha con la que juega la IA
 * @returns Puntuación; positiva si favorece a la IA
 * @see RF19
 */
export function evaluar(tablero: Tablero, yo: Ficha): number {
  let puntaje = 0
  const centro = Math.floor(COLUMNAS / 2)
  for (let fila = 0; fila < FILAS; fila++) {
    if (tablero[fila][centro] === yo) {
      puntaje += 3
    } else if (tablero[fila][centro] !== null) {
      puntaje -= 3
    }
  }
  const ventanas: [number, number][] = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ]
  for (let fila = 0; fila < FILAS; fila++) {
    for (let columna = 0; columna < COLUMNAS; columna++) {
      for (const [pasoFila, pasoColumna] of ventanas) {
        const filaFinal = fila + pasoFila * (FICHAS_PARA_GANAR - 1)
        const columnaFinal = columna + pasoColumna * (FICHAS_PARA_GANAR - 1)
        if (filaFinal >= FILAS || columnaFinal < 0 || columnaFinal >= COLUMNAS) {
          continue
        }
        const celdas = Array.from(
          { length: FICHAS_PARA_GANAR },
          (_, i) => tablero[fila + pasoFila * i][columna + pasoColumna * i],
        )
        puntaje += puntuarVentana(celdas, yo)
      }
    }
  }
  return puntaje
}

/** Valor de jugar `columna` con la ficha `turno`, buscando `profundidad` medios turnos más */
function puntuarMovimiento(
  tablero: Tablero,
  columna: number,
  profundidad: number,
  alfa: number,
  beta: number,
  turno: Ficha,
  yo: Ficha,
  esPosicional: boolean,
): number {
  const { tablero: siguiente, fila } = aplicarMovimiento(tablero, columna, turno)
  // Las victorias cercanas valen más que las lejanas, y las derrotas cercanas pesan más
  if (esCeldaGanadora(siguiente, fila, columna)) {
    return turno === yo ? PUNTAJE_VICTORIA + profundidad : -PUNTAJE_VICTORIA - profundidad
  }
  if (estaTableroLleno(siguiente)) {
    return 0
  }
  if (profundidad === 0) {
    return esPosicional ? evaluar(siguiente, yo) : 0
  }

  const oponente = (1 - turno) as Ficha
  const estaMaximizando = oponente === yo
  let mejor = estaMaximizando ? -Infinity : Infinity
  for (const columnaActual of ORDEN_COLUMNAS) {
    if (siguiente[0][columnaActual] !== null) {
      continue
    }
    const puntaje = puntuarMovimiento(
      siguiente,
      columnaActual,
      profundidad - 1,
      alfa,
      beta,
      oponente,
      yo,
      esPosicional,
    )
    if (estaMaximizando) {
      mejor = Math.max(mejor, puntaje)
      alfa = Math.max(alfa, puntaje)
    } else {
      mejor = Math.min(mejor, puntaje)
      beta = Math.min(beta, puntaje)
    }
    if (alfa >= beta) {
      break
    }
  }
  return mejor
}

/**
 * Elige la columna en la que jugará la IA. `aleatorio` permite pruebas deterministas.
 * @param tablero Tablero de Conecta 4
 * @param yo Ficha con la que juega la IA
 * @param dificultad Dificultad de la IA
 * @param aleatorio Generador de números entre 0 y 1; las pruebas lo reemplazan para ser
 *   deterministas
 * @returns Columna elegida
 * @see RF19, RF20, RE01
 */
export function elegirMovimientoIA(
  tablero: Tablero,
  yo: Ficha,
  dificultad: DificultadIA,
  aleatorio: () => number = Math.random,
): number {
  const movimientos = movimientosValidos(tablero)
  if (movimientos.length === 0) {
    throw new Error('No quedan movimientos')
  }
  const parametros = PARAMETROS_IA[dificultad]

  if (parametros.tasaErrores > 0 && aleatorio() < parametros.tasaErrores) {
    return movimientos[Math.floor(aleatorio() * movimientos.length)]
  }

  let mejorPuntaje = -Infinity
  let mejoresMovimientos: number[] = []
  for (const columna of ORDEN_COLUMNAS) {
    if (!movimientos.includes(columna)) {
      continue
    }
    const puntaje = puntuarMovimiento(
      tablero,
      columna,
      parametros.profundidad - 1,
      -Infinity,
      Infinity,
      yo,
      yo,
      parametros.esPosicional,
    )
    if (puntaje > mejorPuntaje) {
      mejorPuntaje = puntaje
      mejoresMovimientos = [columna]
    } else if (puntaje === mejorPuntaje) {
      mejoresMovimientos.push(columna)
    }
  }
  // Entre jugadas equivalentes se elige al azar para que las partidas varíen
  return mejoresMovimientos[Math.floor(aleatorio() * mejoresMovimientos.length)]
}
