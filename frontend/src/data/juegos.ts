/**
 * Archivo: juegos.ts
 * Módulo: frontend / data
 * Descripción: Información de los cuatro minijuegos y su orden en el lobby.
 * Requerimientos: RF05, RNF09
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import type { IdJuego } from '../types'

// ---------- Tipos ----------
export interface InfoJuego {
  id: IdJuego
  nombre: string
  lema: string
  /** Pantalla de preparación a la que lleva la isla del lobby */
  rutaEntrada: string
  /** Color de la etiqueta; con contraste suficiente para texto blanco */
  color: string
  colorIsla: string
}

// ---------- Constantes ----------
/** Nombre, descripción y colores de cada minijuego */
export const JUEGOS: Record<IdJuego, InfoJuego> = {
  'connect-four': {
    id: 'connect-four',
    nombre: 'Conecta 4',
    lema: 'Alinea cuatro fichas',
    rutaEntrada: '/preparar/connect-four',
    color: 'var(--blue)',
    colorIsla: 'var(--mint)',
  },
  bitbot: {
    id: 'bitbot',
    nombre: 'Arma a BitBot',
    lema: 'Construye y descubre palabras',
    rutaEntrada: '/preparar/bitbot',
    color: '#6d4fd6',
    colorIsla: 'var(--lilac)',
  },
  'ball-sort': {
    id: 'ball-sort',
    nombre: 'Ordenamiento de esferas',
    lema: 'Ordena los colores',
    rutaEntrada: '/preparar/ball-sort',
    color: '#147a58',
    colorIsla: 'var(--mint)',
  },
  memory: {
    id: 'memory',
    nombre: 'Memorama',
    lema: 'Encuentra todas las parejas',
    rutaEntrada: '/preparar/memory',
    color: '#c4520f',
    colorIsla: 'var(--orange)',
  },
}

/** Orden de las islas en el lobby */
export const ORDEN_JUEGOS: IdJuego[] = ['connect-four', 'bitbot', 'ball-sort', 'memory']

// ---------- Funciones ----------
/**
 * Comprueba que un texto (por ejemplo, de la URL) sea uno de los cuatro minijuegos.
 * @param valor Texto que se comprueba
 * @returns true si el valor es un IdJuego
 * @see RF05, RF63
 */
export function esIdJuego(valor: string | undefined): valor is IdJuego {
  return valor !== undefined && valor in JUEGOS
}
