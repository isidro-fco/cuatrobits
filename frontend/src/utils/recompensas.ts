/**
 * Archivo: recompensas.ts
 * Módulo: frontend / utils
 * Descripción: Experiencia y Bits por partida (secciones 9.1 y 9.4). Deben coincidir con
 *              backend/src/models/reglas.ts.
 * Requerimientos: RF46, RF49, RNF14
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import type { IdJuego, Partida } from '../types'

// ---------- Constantes ----------
/** RF46: XP por terminar cualquier partida; perder no resta XP */
export const XP_PARTIDA_COMPLETADA = 10

/** Bono por ganar o completar cada juego */
export const XP_BONO: Record<IdJuego, number> = {
  'connect-four': 15,
  bitbot: 10,
  'ball-sort': 15,
  memory: 10,
}

/** Bits por terminar una partida y bono por ganarla o completarla */
export const BITS_COMPLETADA = 2
/** Bits adicionales por ganar o completar una partida */
export const BITS_EXITO = 3

// ---------- Funciones ----------
/**
 * Experiencia de una partida según la tabla de la sección 9.1. Nunca resta experiencia: perder o
 * empatar otorga la XP base.
 * @param juego Minijuego de la partida
 * @param resultado Resultado de la partida
 * @returns XP otorgada
 * @see RF46, RNF14
 */
export function xpPorPartida(juego: IdJuego, resultado: Partida['resultado']): number {
  const esExitoso = resultado === 'win' || resultado === 'completed'
  return XP_PARTIDA_COMPLETADA + (esExitoso ? XP_BONO[juego] : 0)
}

/**
 * Bits de una partida: 2 por terminarla y 3 más por ganarla o completarla.
 * @param resultado Resultado de la partida
 * @returns Bits otorgados
 * @see RF49
 */
export function bitsPorPartida(resultado: Partida['resultado']): number {
  const esExitoso = resultado === 'win' || resultado === 'completed'
  return BITS_COMPLETADA + (esExitoso ? BITS_EXITO : 0)
}
