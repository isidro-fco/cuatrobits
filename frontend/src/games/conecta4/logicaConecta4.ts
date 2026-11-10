/**
 * Archivo: logicaConecta4.ts
 * Módulo: frontend / games / conecta4
 * Descripción: Reglas de Conecta 4 (sección 5.4). Funciones puras sobre un tablero inmutable.
 * Requerimientos: RF12, RF13, RF14
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Tipos ----------
/** Índice del participante: 0 inicia la partida, 1 responde */
export type Ficha = 0 | 1
export type Celda = Ficha | null
/** `board[fila][columna]`; la fila 0 es la superior */
export type Tablero = Celda[][]
export type Posicion = readonly [fila: number, columna: number]

export interface Victoria {
  ganador: Ficha
  celdas: Posicion[]
}

export type Estatus = { tipo: 'playing' } | { tipo: 'win'; win: Victoria } | { tipo: 'draw' }

// ---------- Constantes ----------
/** Filas del tablero */
export const FILAS = 6
/** Columnas del tablero */
export const COLUMNAS = 7
/** Fichas en línea necesarias para ganar */
export const FICHAS_PARA_GANAR = 4

/** Direcciones en que se buscan líneas: horizontal, vertical y las dos diagonales */
const DIRECCIONES: Posicion[] = [
  [0, 1], // horizontal
  [1, 0], // vertical
  [1, 1], // diagonal descendente
  [1, -1], // diagonal ascendente
]

// ---------- Funciones ----------
/**
 * Crea un tablero vacío de 6 filas por 7 columnas.
 * @returns Tablero sin fichas
 * @see RF12
 */
export function crearTablero(): Tablero {
  return Array.from({ length: FILAS }, () => Array<Celda>(COLUMNAS).fill(null))
}

/**
 * Fila libre más baja de la columna, o -1 si está llena
 * @param tablero Tablero de Conecta 4
 * @param columna Columna del tablero (0 a 6)
 * @returns Índice de la fila o -1
 * @see RF12, RF13
 */
export function filaDestino(tablero: Tablero, columna: number): number {
  for (let fila = FILAS - 1; fila >= 0; fila--) {
    if (tablero[fila][columna] === null) {
      return fila
    }
  }
  return -1
}

/**
 * Indica si se puede jugar en una columna.
 * @param tablero Tablero de Conecta 4
 * @param columna Columna del tablero (0 a 6)
 * @returns true si la columna existe y no está llena
 * @see RF13
 */
export function esMovimientoValido(tablero: Tablero, columna: number): boolean {
  return (
    Number.isInteger(columna) && columna >= 0 && columna < COLUMNAS && tablero[0][columna] === null
  )
}

/**
 * Columnas en las que todavía se puede jugar.
 * @param tablero Tablero de Conecta 4
 * @returns Índices de las columnas libres
 * @see RF13
 */
export function movimientosValidos(tablero: Tablero): number[] {
  const movimientos: number[] = []
  for (let columna = 0; columna < COLUMNAS; columna++) {
    if (esMovimientoValido(tablero, columna)) {
      movimientos.push(columna)
    }
  }
  return movimientos
}

/**
 * Coloca la ficha en la posición libre más baja; lanza un error si la columna está llena
 * @param tablero Tablero de Conecta 4
 * @param columna Columna del tablero (0 a 6)
 * @param ficha Ficha del participante que juega (0 o 1)
 * @returns Tablero nuevo y fila donde quedó la ficha
 * @see RF12, RF13
 */
export function aplicarMovimiento(
  tablero: Tablero,
  columna: number,
  ficha: Ficha,
): { tablero: Tablero; fila: number } {
  if (!esMovimientoValido(tablero, columna)) {
    throw new Error(`La columna ${columna} no admite más fichas`)
  }
  const fila = filaDestino(tablero, columna)
  const siguiente = tablero.map((fila) => fila.slice())
  siguiente[fila][columna] = ficha
  return { tablero: siguiente, fila }
}

/**
 * Busca cuatro fichas consecutivas del mismo participante
 * @param tablero Tablero de Conecta 4
 * @returns Ganador y celdas de la línea, o null
 * @see RF14, RF15
 */
export function buscarVictoria(tablero: Tablero): Victoria | null {
  for (let fila = 0; fila < FILAS; fila++) {
    for (let columna = 0; columna < COLUMNAS; columna++) {
      const ficha = tablero[fila][columna]
      if (ficha === null) {
        continue
      }
      for (const [pasoFila, pasoColumna] of DIRECCIONES) {
        const celdas: Posicion[] = []
        for (let i = 0; i < FICHAS_PARA_GANAR; i++) {
          const filaActual = fila + pasoFila * i
          const columnaActual = columna + pasoColumna * i
          if (
            filaActual < 0 ||
            filaActual >= FILAS ||
            columnaActual < 0 ||
            columnaActual >= COLUMNAS ||
            tablero[filaActual][columnaActual] !== ficha
          ) {
            break
          }
          celdas.push([filaActual, columnaActual])
        }
        if (celdas.length === FICHAS_PARA_GANAR) {
          return { ganador: ficha, celdas }
        }
      }
    }
  }
  return null
}

/**
 * Verdadero si la ficha en (fila, columna) forma parte de una línea de cuatro; más rápido que
 * `buscarVictoria`
 * @param tablero Tablero de Conecta 4
 * @param fila Fila del tablero (0 a 5, de arriba hacia abajo)
 * @param columna Columna del tablero (0 a 6)
 * @returns true si la celda completa cuatro en línea
 * @see RF14
 */
export function esCeldaGanadora(tablero: Tablero, fila: number, columna: number): boolean {
  const ficha = tablero[fila][columna]
  if (ficha === null) {
    return false
  }
  for (const [pasoFila, pasoColumna] of DIRECCIONES) {
    let cantidad = 1
    for (const signo of [1, -1]) {
      let filaActual = fila + pasoFila * signo
      let columnaActual = columna + pasoColumna * signo
      while (
        filaActual >= 0 &&
        filaActual < FILAS &&
        columnaActual >= 0 &&
        columnaActual < COLUMNAS &&
        tablero[filaActual][columnaActual] === ficha
      ) {
        cantidad++
        filaActual += pasoFila * signo
        columnaActual += pasoColumna * signo
      }
    }
    if (cantidad >= FICHAS_PARA_GANAR) {
      return true
    }
  }
  return false
}

/**
 * Indica si ya no quedan huecos libres.
 * @param tablero Tablero de Conecta 4
 * @returns true si todas las columnas están llenas
 * @see RF14
 */
export function estaTableroLleno(tablero: Tablero): boolean {
  return tablero[0].every((celda) => celda !== null)
}

/**
 * Indica si la partida sigue, terminó en victoria o en empate.
 * @param tablero Tablero de Conecta 4
 * @returns Estatus de la partida
 * @see RF14
 */
export function obtenerEstatus(tablero: Tablero): Estatus {
  const win = buscarVictoria(tablero)
  if (win) {
    return { tipo: 'win', win }
  }
  if (estaTableroLleno(tablero)) {
    return { tipo: 'draw' }
  }
  return { tipo: 'playing' }
}

/**
 * Construye un tablero a partir de filas de texto (`.`, `0`, `1`); útil en pruebas
 * @param filas Seis cadenas de siete caracteres, de arriba hacia abajo
 * @returns Tablero equivalente
 * @see RNF15
 */
export function tableroDesdeFilas(filas: string[]): Tablero {
  return filas.map((fila) =>
    [...fila].map((caracter) => (caracter === '0' ? 0 : caracter === '1' ? 1 : null)),
  )
}
