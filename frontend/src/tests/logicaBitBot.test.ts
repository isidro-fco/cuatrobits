/**
 * Archivo: logicaBitBot.test.ts
 * Módulo: frontend / tests
 * Descripción: Pruebas de las reglas de Arma a BitBot.
 * Requerimientos: RF25, RF26, RF27, RF28, RNF15
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { beforeEach, describe, expect, it } from 'vitest'

// ---------- Módulos internos ----------
import { CATEGORIAS } from '../data/categorias'
import { CONTENIDO } from '../data/contenido'
import { leerConfiguracionBitBot } from '../games/bitbot/configuracionBitBot'
import { obtenerRecientes, recordarRecientes } from '../utils/recientes'
import {
  piezasEnsambladas,
  intentosRestantes,
  crearJuegoBitBot,
  obtenerSituacionBitBot,
  adivinarLetra,
  PIEZAS_INICIALES,
  FILAS_TECLADO,
  MAX_ERRORES_BITBOT,
  palabraOculta,
  normalizarLetra,
  seleccionarPalabra,
  palabrasRecientesAEvitar,
  TOTAL_PIEZAS,
  letrasIncorrectas,
} from '../games/bitbot/logicaBitBot'

// ---------- Pruebas ----------
const adivinarTodo = (palabra: string, letras: string) =>
  [...letras].reduce((estado, letra) => adivinarLetra(estado, letra), crearJuegoBitBot(palabra))

describe('reglas de Arma a BitBot (sección 16.3)', () => {
  it('empieza con la palabra oculta, tres piezas y cinco intentos', () => {
    const estado = crearJuegoBitBot('GATO')
    expect(palabraOculta(estado)).toEqual([null, null, null, null])
    expect(piezasEnsambladas(estado)).toBe(PIEZAS_INICIALES)
    expect(intentosRestantes(estado)).toBe(MAX_ERRORES_BITBOT)
  })

  it('revela todas las apariciones de una letra correcta', () => {
    const estado = adivinarLetra(crearJuegoBitBot('BANANA'), 'A')
    expect(palabraOculta(estado)).toEqual([null, 'A', null, 'A', null, 'A'])
  })

  it('una letra correcta no consume intentos', () => {
    expect(intentosRestantes(adivinarLetra(crearJuegoBitBot('GATO'), 'G'))).toBe(MAX_ERRORES_BITBOT)
  })

  it('cada error reduce un intento', () => {
    const estado = adivinarTodo('GATO', 'XZ')
    expect(intentosRestantes(estado)).toBe(MAX_ERRORES_BITBOT - 2)
    expect(letrasIncorrectas(estado)).toEqual(['X', 'Z'])
  })

  it('una letra ya usada no se puede elegir de nuevo', () => {
    const unaVez = adivinarLetra(crearJuegoBitBot('GATO'), 'X')
    const dosVeces = adivinarLetra(unaVez, 'X')
    expect(dosVeces).toBe(unaVez)
    expect(intentosRestantes(dosVeces)).toBe(MAX_ERRORES_BITBOT - 1)
  })

  it('gana al completar la palabra y BitBot queda armado', () => {
    const estado = adivinarTodo('GATO', 'GATO')
    expect(obtenerSituacionBitBot(estado)).toBe('won')
    expect(piezasEnsambladas(estado)).toBe(TOTAL_PIEZAS)
  })

  it('pierde al agotar los cinco intentos', () => {
    const estado = adivinarTodo('GATO', 'BCDEF')
    expect(obtenerSituacionBitBot(estado)).toBe('lost')
    expect(intentosRestantes(estado)).toBe(0)
  })

  it('no acepta letras después de terminar', () => {
    const perdido = adivinarTodo('GATO', 'BCDEF')
    expect(adivinarLetra(perdido, 'G')).toBe(perdido)
    const partidaGanada = adivinarTodo('GATO', 'GATO')
    expect(adivinarLetra(partidaGanada, 'X')).toBe(partidaGanada)
  })

  it('las piezas crecen con los aciertos y no con los errores', () => {
    const palabra = crearJuegoBitBot('MANZANA')
    const trasError = adivinarLetra(palabra, 'X')
    expect(piezasEnsambladas(trasError)).toBe(PIEZAS_INICIALES)
    const trasAcierto = adivinarLetra(trasError, 'A')
    expect(piezasEnsambladas(trasAcierto)).toBeGreaterThan(PIEZAS_INICIALES)
    expect(piezasEnsambladas(trasAcierto)).toBeLessThan(TOTAL_PIEZAS)
  })
})

describe('normalización de letras (sección 6.2)', () => {
  it('ignora tildes y mayúsculas, pero distingue la Ñ', () => {
    expect(normalizarLetra('á')).toBe('A')
    expect(normalizarLetra('Ü')).toBe('U')
    expect(normalizarLetra('ñ')).toBe('Ñ')
  })

  it('la letra sin tilde revela la letra con tilde', () => {
    const estado = adivinarTodo('LÁPIZ', 'A')
    expect(palabraOculta(estado)).toEqual([null, 'Á', null, null, null])
  })

  it('la Ñ no revela la N', () => {
    const estado = adivinarLetra(crearJuegoBitBot('PIÑA'), 'N')
    expect(palabraOculta(estado)).toEqual([null, null, null, null])
    expect(intentosRestantes(estado)).toBe(MAX_ERRORES_BITBOT - 1)
  })
})

describe('catálogo de palabras', () => {
  const teclado = new Set(FILAS_TECLADO.join(''))

  it('todas las palabras se pueden escribir con el teclado en pantalla y tienen pista', () => {
    for (const { palabras } of Object.values(CONTENIDO)) {
      expect(palabras.length).toBeGreaterThanOrEqual(5)
      for (const { palabra, pista } of palabras) {
        expect(pista.length).toBeGreaterThan(0)
        for (const caracter of palabra) {
          expect(teclado.has(normalizarLetra(caracter))).toBe(true)
        }
      }
    }
  })

  it('solo acepta categorías de la dificultad elegida', () => {
    expect(leerConfiguracionBitBot(new URLSearchParams('categoria=space&dificultad=hard'))).toEqual(
      {
        categoria: 'space',
        dificultad: 'hard',
      },
    )
    expect(
      leerConfiguracionBitBot(new URLSearchParams('categoria=space&dificultad=easy')),
    ).toBeNull()
    expect(
      leerConfiguracionBitBot(new URLSearchParams('categoria=nada&dificultad=easy')),
    ).toBeNull()
    expect(CATEGORIAS.every((opcion) => CONTENIDO[opcion.id])).toBe(true)
  })
})

describe('variedad de palabras', () => {
  beforeEach(() => localStorage.clear())

  it('no repite una palabra hasta que sale la mitad de la categoría', () => {
    const palabras = CONTENIDO.animals.palabras
    const conservar = palabrasRecientesAEvitar(palabras.length)
    const vistos: string[] = []
    for (let i = 0; i < 60; i++) {
      const { palabra } = seleccionarPalabra(palabras, obtenerRecientes('bitbot:animals'))
      expect(vistos.slice(-conservar), `partida ${i}`).not.toContain(palabra)
      vistos.push(palabra)
      recordarRecientes('bitbot:animals', [palabra], conservar)
    }
  })

  it('si todas son recientes, elige cualquiera', () => {
    const palabras = CONTENIDO.colors.palabras.slice(0, 2)
    expect(palabras).toContainEqual(
      seleccionarPalabra(
        palabras,
        palabras.map((entrada) => entrada.palabra),
      ),
    )
  })

  it('cada categoría tiene al menos 20 palabras distintas', () => {
    for (const { palabras } of Object.values(CONTENIDO)) {
      expect(palabras.length).toBeGreaterThanOrEqual(20)
      expect(new Set(palabras.map((entrada) => entrada.palabra)).size).toBe(palabras.length)
    }
  })
})
