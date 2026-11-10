/**
 * Archivo: logicaEsferas.test.ts
 * Módulo: frontend / tests
 * Descripción: Pruebas de las reglas y del generador de Ordenamiento de esferas.
 * Requerimientos: RF32, RF33, RF35, RF36, RNF15
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { describe, expect, it } from 'vitest'

// ---------- Módulos internos ----------
import {
  MAX_COLORES,
  MIN_COLORES,
  COLORES_ESFERAS,
  SIMBOLOS_ESFERAS,
  ESFERAS_POR_COLOR,
  calcularTubos,
} from '../data/esferas'
import { leerConfiguracionEsferas } from '../games/esferas/configuracionEsferas'
import {
  esPosibleMover,
  CAPACIDAD_MAXIMA,
  tubosCompletos,
  generarNivel,
  generarNivelResoluble,
  estaResuelto,
  moverEsfera,
  resolver,
  validarSolucion,
  type Tubos,
} from '../games/esferas/logicaEsferas'

// ---------- Pruebas ----------
function sembrado(semilla: number) {
  return () => {
    semilla = (semilla * 1664525 + 1013904223) % 2 ** 32
    return semilla / 2 ** 32
  }
}

describe('calcularTubos', () => {
  it('aplica T(c) = max(5, c + 2)', () => {
    expect(calcularTubos(1)).toBe(5)
    expect(calcularTubos(3)).toBe(5)
    expect(calcularTubos(5)).toBe(7)
    expect(calcularTubos(10)).toBe(12)
  })

  it('deja siempre al menos dos tubos vacíos', () => {
    for (let colores = 1; colores <= MAX_COLORES; colores++) {
      expect(calcularTubos(colores) - colores).toBeGreaterThanOrEqual(2)
    }
  })

  it('tiene un color y un símbolo distinto para cada opción', () => {
    expect(new Set(COLORES_ESFERAS).size).toBe(MAX_COLORES)
    expect(new Set(SIMBOLOS_ESFERAS).size).toBe(MAX_COLORES)
  })
})

describe('reglas de movimiento (sección 16.4)', () => {
  // Colores: 0 y 1
  const tubos: Tubos = [[0, 1], [1], [0, 0, 0, 0, 1], [], [0, 0, 1, 1, 1]]

  it('permite mover sobre el mismo color o a un tubo vacío', () => {
    expect(esPosibleMover(tubos, 0, 1)).toBe(true)
    expect(esPosibleMover(tubos, 0, 3)).toBe(true)
  })

  it('no permite mover sobre otro color', () => {
    expect(esPosibleMover(tubos, 1, 0)).toBe(true)
    expect(esPosibleMover([[0], [1]], 0, 1)).toBe(false)
  })

  it('respeta la capacidad de cinco esferas', () => {
    expect(CAPACIDAD_MAXIMA).toBe(5)
    expect(esPosibleMover(tubos, 1, 2)).toBe(false)
    expect(esPosibleMover(tubos, 1, 4)).toBe(false)
  })

  it('no mueve desde un tubo vacío ni al mismo tubo', () => {
    expect(esPosibleMover(tubos, 3, 0)).toBe(false)
    expect(esPosibleMover(tubos, 0, 0)).toBe(false)
  })

  it('solo mueve la esfera superior y actualiza ambos tubos', () => {
    const siguiente = moverEsfera(tubos, 0, 1)
    expect(siguiente[0]).toEqual([0])
    expect(siguiente[1]).toEqual([1, 1])
    expect(tubos[0]).toEqual([0, 1])
    expect(() => moverEsfera(tubos, 3, 0)).toThrow()
  })

  it('el nivel se completa cuando cada tubo ocupado tiene un solo color', () => {
    expect(estaResuelto([[0, 0, 0, 0, 0], [], [1, 1, 1, 1, 1]])).toBe(true)
    expect(estaResuelto([[0, 0, 0, 0, 1], [], [1, 1, 1, 1, 0]])).toBe(false)
    expect(estaResuelto([[0, 0, 0], [0, 0], []])).toBe(false)
  })
})

describe('generador de niveles (sección 7.4)', () => {
  for (let colores = MIN_COLORES; colores <= MAX_COLORES; colores++) {
    it(
      `con ${colores} ${colores === 1 ? 'color' : 'colores'} crea niveles resolubles y no ` +
        `resueltos`,
      () => {
        const aleatorio = sembrado(colores * 97)
        for (let i = 0; i < 5; i++) {
          const { tubos: nivel, solucion } = generarNivelResoluble(colores, aleatorio)
          // Número de tubos y esferas según la configuración
          expect(nivel).toHaveLength(calcularTubos(colores))
          const esferas = nivel.flat()
          expect(esferas).toHaveLength(colores * ESFERAS_POR_COLOR)
          for (let color = 0; color < colores; color++) {
            expect(esferas.filter((esfera) => esfera === color)).toHaveLength(ESFERAS_POR_COLOR)
          }
          expect(nivel.every((tubo) => tubo.length <= CAPACIDAD_MAXIMA)).toBe(true)
          expect(estaResuelto(nivel)).toBe(false)

          // Ningún tubo empieza completo
          expect(tubosCompletos(nivel)).toBe(0)

          // La solución que acompaña al nivel solo usa movimientos legales y termina en el estado
          // resuelto
          let estado = nivel
          for (const [origen, destino] of solucion) {
            expect(esPosibleMover(estado, origen, destino)).toBe(true)
            estado = moverEsfera(estado, origen, destino)
          }
          expect(estaResuelto(estado)).toBe(true)
        }
      },
    )
  }

  it('generateLevel entrega un nivel con solución', () => {
    const nivel = generarNivel(6, sembrado(5))
    expect(resolver(nivel, 200_000)).not.toBeNull()
  })

  it('verifySolution rechaza movimientos ilegales o que no terminan el nivel', () => {
    const tubos: Tubos = [[0, 0, 0, 0, 1], [1, 1, 1, 1, 0], [], [], []]
    expect(
      validarSolucion(tubos, [
        [0, 2],
        [1, 3],
        [2, 1],
        [3, 0],
      ]),
    ).toBe(true)
    expect(validarSolucion(tubos, [[0, 1]])).toBe(false)
    expect(validarSolucion(tubos, [[0, 2]])).toBe(false)
  })

  it('aunque el azar siempre devuelva lo mismo, el nivel tiene solución verificada', () => {
    for (const valor of [0, 0.42, 0.999]) {
      for (let colores = MIN_COLORES; colores <= MAX_COLORES; colores++) {
        const { tubos, solucion } = generarNivelResoluble(colores, () => valor)
        expect(estaResuelto(tubos)).toBe(false)
        expect(validarSolucion(tubos, solucion)).toBe(true)
      }
    }
  })

  it('el solucionador reconoce un nivel sin solución', () => {
    // Dos tubos llenos y mezclados sin espacio libre
    expect(
      resolver([
        [0, 1, 0, 1, 0],
        [1, 0, 1, 0, 1],
      ]),
    ).toBeNull()
  })
})

describe('configuración de esferas', () => {
  it('acepta de 1 a 10 colores', () => {
    expect(leerConfiguracionEsferas(new URLSearchParams('colores=4'))).toEqual({ colores: 4 })
    expect(leerConfiguracionEsferas(new URLSearchParams('colores=0'))).toBeNull()
    expect(leerConfiguracionEsferas(new URLSearchParams('colores=11'))).toBeNull()
    expect(leerConfiguracionEsferas(new URLSearchParams('colores=2.5'))).toBeNull()
    expect(leerConfiguracionEsferas(new URLSearchParams(''))).toBeNull()
  })
})
