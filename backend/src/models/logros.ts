/**
 * Archivo: logros.ts
 * Módulo: backend / models
 * Descripción: Condiciones de los logros (sección 9.3). Deben coincidir con
 *              frontend/src/utils/reglasLogros.ts; una prueba lo comprueba.
 * Requerimientos: RF48
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import { IDS_JUEGOS, type IdJuego } from './reglas.js'

// ---------- Tipos ----------
/** Totales del jugador a partir de sus partidas registradas */
export interface ResumenLogros {
  partidasJugadas: number
  /** Victorias en Conecta 4 y BitBot, niveles o tableros completados en esferas y Memorama */
  exitosPorJuego: Record<IdJuego, number>
  /** Parejas encontradas en todas las partidas de Memorama */
  parejasMemorama: number
}

// ---------- Funciones ----------
const exitos = (resumen: ResumenLogros) =>
  IDS_JUEGOS.reduce((acumulado, juego) => acumulado + resumen.exitosPorJuego[juego], 0)

/** Mismo orden que database/seeds/001_logros.sql */
export const REGLAS_LOGROS: {
  id: string
  desbloqueados: (resumenActual: ResumenLogros) => boolean
}[] = [
  { id: 'first-game', desbloqueados: (resumen) => resumen.partidasJugadas >= 1 },
  { id: 'first-win', desbloqueados: (resumen) => exitos(resumen) >= 1 },
  { id: 'five-games', desbloqueados: (resumen) => resumen.partidasJugadas >= 5 },
  {
    id: 'win-each-game',
    desbloqueados: (resumen) => IDS_JUEGOS.every((juego) => resumen.exitosPorJuego[juego] >= 1),
  },
  { id: 'bitbot-10', desbloqueados: (resumen) => resumen.exitosPorJuego.bitbot >= 10 },
  { id: 'ball-sort-5', desbloqueados: (resumen) => resumen.exitosPorJuego['ball-sort'] >= 5 },
  { id: 'memory-10', desbloqueados: (resumen) => resumen.parejasMemorama >= 10 },
]

/**
 * Evalúa las condiciones de todos los logros.
 * @param resumen Totales del jugador que deciden los logros
 * @returns Ids de los logros cumplidos
 * @see RF48
 */
export function evaluarLogros(resumen: ResumenLogros): string[] {
  return REGLAS_LOGROS.filter((regla) => regla.desbloqueados(resumen)).map((regla) => regla.id)
}
