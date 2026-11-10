/**
 * Archivo: logicaConecta4.test.ts
 * Módulo: frontend / tests
 * Descripción: Pruebas de las reglas, la IA y los colores de Conecta 4.
 * Requerimientos: RF12, RF13, RF14, RF16, RF19, RF20, RNF03, RNF15
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { describe, expect, it } from 'vitest'

// ---------- Módulos internos ----------
import { elegirMovimientoIA, type DificultadIA } from '../games/conecta4/iaMinimax'
import {
  esParSimilar,
  PALETA_FICHAS,
  leerConfiguracionConecta4,
  elegirColoresFichas,
} from '../games/conecta4/configuracionConecta4'
import {
  aplicarMovimiento,
  tableroDesdeFilas,
  COLUMNAS,
  crearTablero,
  type Ficha,
  filaDestino,
  buscarVictoria,
  obtenerEstatus,
  esMovimientoValido,
  FILAS,
  movimientosValidos,
} from '../games/conecta4/logicaConecta4'

// ---------- Constantes ----------
/** Fila vacía del tablero */
const VACIO = '.......'

// ---------- Pruebas ----------
/** Generador pseudoaleatorio reproducible */
function sembrado(semilla: number) {
  return () => {
    semilla = (semilla * 1664525 + 1013904223) % 2 ** 32
    return semilla / 2 ** 32
  }
}

describe('reglas de Conecta 4 (sección 16.2)', () => {
  it('el tablero comienza vacío con 6 filas y 7 columnas', () => {
    const tablero = crearTablero()
    expect(tablero).toHaveLength(FILAS)
    expect(
      tablero.every((fila) => fila.length === COLUMNAS && fila.every((celda) => celda === null)),
    ).toBe(true)
  })

  it('la ficha ocupa la posición libre más baja de la columna', () => {
    let tablero = crearTablero()
    tablero = aplicarMovimiento(tablero, 3, 0).tablero
    const segundo = aplicarMovimiento(tablero, 3, 1)
    expect(tablero[FILAS - 1][3]).toBe(0)
    expect(segundo.fila).toBe(FILAS - 2)
    expect(segundo.tablero[FILAS - 2][3]).toBe(1)
  })

  it('no permite movimientos en columnas llenas', () => {
    let tablero = crearTablero()
    for (let i = 0; i < FILAS; i++) {
      tablero = aplicarMovimiento(tablero, 0, (i % 2) as Ficha).tablero
    }
    expect(filaDestino(tablero, 0)).toBe(-1)
    expect(esMovimientoValido(tablero, 0)).toBe(false)
    expect(movimientosValidos(tablero)).not.toContain(0)
    expect(() => aplicarMovimiento(tablero, 0, 0)).toThrow()
  })

  it('no modifica el tablero original', () => {
    const tablero = crearTablero()
    aplicarMovimiento(tablero, 2, 0)
    expect(tablero[FILAS - 1][2]).toBeNull()
  })

  it('detecta victorias horizontales', () => {
    const tablero = tableroDesdeFilas([VACIO, VACIO, VACIO, VACIO, '.111...', '.0000..'])
    expect(buscarVictoria(tablero)).toEqual({
      ganador: 0,
      celdas: [
        [5, 1],
        [5, 2],
        [5, 3],
        [5, 4],
      ],
    })
  })

  it('detecta victorias verticales', () => {
    const tablero = tableroDesdeFilas([VACIO, VACIO, '..1....', '..10...', '..10...', '..10...'])
    expect(buscarVictoria(tablero)?.ganador).toBe(1)
    expect(buscarVictoria(tablero)?.celdas).toHaveLength(4)
  })

  it('detecta victorias en diagonal ascendente y descendente', () => {
    const arriba = tableroDesdeFilas([VACIO, VACIO, '...0...', '..01...', '.011...', '0111...'])
    expect(buscarVictoria(arriba)?.ganador).toBe(0)
    const abajo = tableroDesdeFilas([VACIO, VACIO, '1......', '01.....', '001....', '0001...'])
    expect(buscarVictoria(abajo)?.ganador).toBe(1)
  })

  it('tres en línea no es victoria', () => {
    const tablero = tableroDesdeFilas([VACIO, VACIO, VACIO, VACIO, VACIO, '000.111'])
    expect(buscarVictoria(tablero)).toBeNull()
    expect(obtenerEstatus(tablero).tipo).toBe('playing')
  })

  it('detecta el empate cuando el tablero se llena sin ganador', () => {
    const tablero = tableroDesdeFilas([
      '0011001',
      '1100110',
      '0011001',
      '1100110',
      '0011001',
      '1100110',
    ])
    expect(buscarVictoria(tablero)).toBeNull()
    expect(obtenerEstatus(tablero).tipo).toBe('draw')
  })
})

describe('IA de Conecta 4', () => {
  const dificultades: DificultadIA[] = ['easy', 'normal', 'hard']

  it.each(dificultades)('en dificultad %s realiza siempre movimientos válidos', (dificultad) => {
    const aleatorio = sembrado(7)
    let tablero = crearTablero()
    let turno: Ficha = 0
    while (obtenerEstatus(tablero).tipo === 'playing') {
      const columna =
        turno === 1
          ? elegirMovimientoIA(tablero, 1, dificultad, aleatorio)
          : movimientosValidos(tablero)[
              Math.floor(aleatorio() * movimientosValidos(tablero).length)
            ]
      expect(esMovimientoValido(tablero, columna)).toBe(true)
      tablero = aplicarMovimiento(tablero, columna, turno).tablero
      turno = (1 - turno) as Ficha
    }
  })

  it('juega en la única columna libre', () => {
    const tablero = tableroDesdeFilas([
      '00110.1',
      '1100110',
      '0011001',
      '1100110',
      '0011001',
      '1100110',
    ])
    expect(elegirMovimientoIA(tablero, 1, 'hard')).toBe(5)
  })

  it.each(['normal', 'hard'] as const)(
    'en dificultad %s aprovecha una jugada ganadora',
    (dificultad) => {
      const tablero = tableroDesdeFilas([VACIO, VACIO, VACIO, VACIO, '0.0....', '0111...'])
      expect(elegirMovimientoIA(tablero, 1, dificultad)).toBe(4)
    },
  )

  it.each(['normal', 'hard'] as const)(
    'en dificultad %s bloquea la victoria inmediata del rival',
    (dificultad) => {
      const tablero = tableroDesdeFilas([VACIO, VACIO, VACIO, VACIO, '1...1..', '000.1..'])
      expect(elegirMovimientoIA(tablero, 1, dificultad)).toBe(3)
    },
  )

  it('en dificultad difícil prefiere ganar antes que bloquear', () => {
    const tablero = tableroDesdeFilas([VACIO, VACIO, VACIO, '1......', '1......', '1000...'])
    expect(elegirMovimientoIA(tablero, 1, 'hard')).toBe(0)
  })
})

describe('configuración de Conecta 4', () => {
  it('lee el modo y la dificultad de la URL', () => {
    expect(leerConfiguracionConecta4(new URLSearchParams('modo=ia&dificultad=hard'))).toEqual({
      modo: 'ai',
      dificultad: 'hard',
    })
    expect(leerConfiguracionConecta4(new URLSearchParams('modo=local'))).toEqual({ modo: 'local' })
    expect(leerConfiguracionConecta4(new URLSearchParams('modo=ia'))).toBeNull()
    expect(leerConfiguracionConecta4(new URLSearchParams(''))).toBeNull()
  })

  it('asigna dos colores distintos (sección 5.3)', () => {
    const aleatorio = sembrado(3)
    for (let i = 0; i < 50; i++) {
      const [primeraFicha, segundaFicha] = elegirColoresFichas(aleatorio)
      expect(primeraFicha.color).not.toBe(segundaFicha.color)
      expect(esParSimilar(primeraFicha, segundaFicha)).toBe(false)
    }
  })

  // Contraste según WCAG: luminancia relativa de un color hexadecimal
  const luminancia = (hexadecimal: string) => {
    const [rojo, verde, azul] = [1, 3, 5].map((i) => {
      const canal = parseInt(hexadecimal.slice(i, i + 2), 16) / 255
      return canal <= 0.03928 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * rojo + 0.7152 * verde + 0.0722 * azul
  }
  const contraste = (primerColor: string, segundoColor: string) => {
    const [limiteSuperior, limiteInferior] = [
      luminancia(primerColor),
      luminancia(segundoColor),
    ].sort((primero, segundo) => segundo - primero)
    return (limiteSuperior + 0.05) / (limiteInferior + 0.05)
  }

  // Intensidad del color: 0 en blancos y grises, 1 en colores puros
  const croma = (hexadecimal: string) => {
    const canales = [1, 3, 5].map((i) => parseInt(hexadecimal.slice(i, i + 2), 16) / 255)
    return Math.max(...canales) - Math.min(...canales)
  }

  it('todas las fichas son de colores intensos y su símbolo se lee', () => {
    // La paleta anterior tenía blanco (0) y un lila pálido (0.31), que se confundían con los huecos
    expect(croma('#ffffff')).toBe(0)
    expect(croma('#c4b0ff')).toBeLessThan(0.5)
    for (const ficha of PALETA_FICHAS) {
      expect(croma(ficha.color), ficha.nombre).toBeGreaterThanOrEqual(0.5)
      expect(contraste(ficha.color, ficha.tinta), ficha.nombre).toBeGreaterThanOrEqual(3)
    }
  })

  it('con cualquier primer color quedan opciones para el segundo', () => {
    for (let i = 0; i < PALETA_FICHAS.length; i++) {
      const [primeraFicha, segundaFicha] = elegirColoresFichas(
        () => (i + 0.5) / PALETA_FICHAS.length,
      )
      expect(primeraFicha).toBe(PALETA_FICHAS[i])
      expect(segundaFicha).toBeDefined()
    }
  })
})
