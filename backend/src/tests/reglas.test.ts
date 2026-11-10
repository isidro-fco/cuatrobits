/**
 * Archivo: reglas.test.ts
 * Módulo: backend / tests
 * Descripción: Comprueba que las reglas de XP, niveles, logros y precios coinciden entre frontend y
 *              backend.
 * Requerimientos: RF46, RF47, RF48, RF49, RNF14
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { describe, expect, it } from 'vitest'

// ---------- Módulos internos ----------
import { COSMETICOS } from '../../../frontend/src/data/cosmeticos.js'
import * as logrosFrontend from '../../../frontend/src/utils/reglasLogros.js'
import * as progresionFrontend from '../../../frontend/src/utils/progresion.js'
import * as reglasFrontend from '../../../frontend/src/utils/recompensas.js'
import { type ResumenLogros, evaluarLogros } from '../models/logros.js'
import { PRECIOS_ARTICULOS } from '../models/cosmeticos.js'
import {
  bitsPorPartida,
  IDS_JUEGOS,
  calcularNivel,
  RESULTADOS_POR_JUEGO,
  xpPorPartida,
  xpParaSiguienteNivel,
} from '../models/reglas.js'
import { normalizarUsername } from '../models/esquemas.js'
import * as usernameFrontend from '../../../frontend/src/utils/username.js'

// ---------- Pruebas ----------
// El frontend calcula la XP que envía; si las tablas no coinciden, el servidor rechazaría las
// partidas
describe('reglas compartidas con el frontend', () => {
  it('la experiencia por partida coincide', () => {
    for (const juego of IDS_JUEGOS) {
      for (const resultado of RESULTADOS_POR_JUEGO[juego]) {
        expect(xpPorPartida(juego, resultado)).toBe(reglasFrontend.xpPorPartida(juego, resultado))
      }
    }
  })

  it('los Bits por partida coinciden', () => {
    for (const juego of IDS_JUEGOS) {
      for (const resultado of RESULTADOS_POR_JUEGO[juego]) {
        expect(bitsPorPartida(resultado)).toBe(reglasFrontend.bitsPorPartida(resultado))
      }
    }
  })

  it('las condiciones de los logros coinciden', () => {
    // Recorre combinaciones alrededor de cada umbral
    for (const partidasJugadas of [0, 1, 4, 5, 20]) {
      for (const bitbot of [0, 1, 9, 10]) {
        for (const ordenamientoEsferas of [0, 4, 5]) {
          for (const parejasMemorama of [0, 8, 10]) {
            for (const otros of [0, 1]) {
              const resumen: ResumenLogros = {
                partidasJugadas,
                exitosPorJuego: {
                  'connect-four': otros,
                  bitbot,
                  'ball-sort': ordenamientoEsferas,
                  memory: otros,
                },
                parejasMemorama,
              }
              expect(evaluarLogros(resumen)).toEqual(logrosFrontend.evaluarLogros(resumen))
            }
          }
        }
      }
    }
  })

  it('los precios de los artículos coinciden', () => {
    expect(
      Object.fromEntries(COSMETICOS.map((articulo) => [articulo.id, articulo.precio])),
    ).toEqual(PRECIOS_ARTICULOS)
  })

  it('la tabla de niveles coincide', () => {
    for (let xp = 0; xp <= 5000; xp += 37) {
      expect(calcularNivel(xp)).toBe(progresionFrontend.calcularNivel(xp).nivel)
    }
    for (let nivel = 1; nivel < 20; nivel++) {
      expect(xpParaSiguienteNivel(nivel)).toBe(progresionFrontend.xpParaSiguienteNivel(nivel))
    }
  })

  it('la normalización de nombres coincide', () => {
    for (const nombre of ['Luna', 'JUGADOR01', '  Peña ', 'Ángel']) {
      expect(normalizarUsername(nombre)).toBe(usernameFrontend.normalizarUsername(nombre))
    }
  })
})
