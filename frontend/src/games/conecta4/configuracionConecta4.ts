/**
 * Archivo: configuracionConecta4.ts
 * Módulo: frontend / games / conecta4
 * Descripción: Configuración de Conecta 4 (modo, dificultad de la IA y colores de las fichas).
 * Requerimientos: RF16, RF17, RF18, RNF03
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import type { DificultadIA } from './iaMinimax'
import type { NombreGlifo } from '../../data/glifosPixel'

// ---------- Tipos ----------
export type ConfiguracionConecta4 = { modo: 'ai'; dificultad: DificultadIA } | { modo: 'local' }

// Paleta de fichas (sección 5.3). Colores intensos que resaltan sobre los huecos claros del
// tablero;
// cada ficha lleva además un símbolo para no depender solo del color.
export interface EstiloFicha {
  nombre: string
  color: string
  /** Color del símbolo, elegido para que contraste con la ficha */
  tinta: string
}

// ---------- Constantes ----------
/** Nombre que se muestra de cada dificultad de la IA */
export const NOMBRES_DIFICULTAD_IA: Record<DificultadIA, string> = {
  easy: 'Fácil',
  normal: 'Normal',
  hard: 'Difícil',
}

/** Color del símbolo sobre las fichas claras */
const TINTA_OSCURA = '#14295c'
/** Color del símbolo sobre las fichas oscuras */
const TINTA_CLARA = '#ffffff'

/** Paleta de fichas (sección 5.3); cada partida elige dos al azar (RF16) */
export const PALETA_FICHAS: EstiloFicha[] = [
  { nombre: 'roja', color: '#e63946', tinta: TINTA_CLARA },
  { nombre: 'amarilla', color: '#ffc61a', tinta: TINTA_OSCURA },
  { nombre: 'verde', color: '#16a34a', tinta: TINTA_CLARA },
  { nombre: 'naranja', color: '#f97316', tinta: TINTA_OSCURA },
  { nombre: 'rosa', color: '#e83e8c', tinta: TINTA_CLARA },
  { nombre: 'morada', color: '#7c3aed', tinta: TINTA_CLARA },
]

/** Parejas que se parecen demasiado, sobre todo con daltonismo; nunca se asignan juntas */
const PARES_SIMILARES = [
  ['roja', 'rosa'],
  ['roja', 'naranja'],
  ['rosa', 'morada'],
]

/** Símbolo de cada participante para no depender solo del color (RNF03) */
export const SIMBOLOS_FICHAS = ['star', 'circle'] as const satisfies readonly NombreGlifo[]

// ---------- Funciones ----------
function esDificultadIA(valor: string | null): valor is DificultadIA {
  return valor !== null && valor in NOMBRES_DIFICULTAD_IA
}

/**
 * Lee la configuración de la URL; `null` si falta o no es válida
 * @param parametros Parámetros de búsqueda de la URL
 * @returns Modo, dificultad, nombres y colores, o null
 * @see RF16, RF17, RF18
 */
export function leerConfiguracionConecta4(
  parametros: URLSearchParams,
): ConfiguracionConecta4 | null {
  const modo = parametros.get('modo')
  if (modo === 'local') {
    return { modo: 'local' }
  }
  const dificultad = parametros.get('dificultad')
  if (modo === 'ia' && esDificultadIA(dificultad)) {
    return { modo: 'ai', dificultad }
  }
  return null
}

/**
 * Construye la ruta de la partida con su configuración en la URL.
 * @param configuracion Configuración de la partida leída de la URL
 * @returns Ruta /juego/connect-four con sus parámetros
 * @see RF63
 */
export function rutaConecta4(configuracion: ConfiguracionConecta4): string {
  return configuracion.modo === 'local'
    ? '/juego/connect-four?modo=local'
    : `/juego/connect-four?modo=ia&dificultad=${configuracion.dificultad}`
}

/**
 * Indica si dos colores de ficha se confunden entre sí y no deben usarse juntos.
 * @param primera Primer color
 * @param segunda Segundo color
 * @returns true si el par está en PARES_SIMILARES
 * @see RF16, RNF03
 */
export const esParSimilar = (primera: EstiloFicha, segunda: EstiloFicha) =>
  PARES_SIMILARES.some(
    ([nombreA, nombreB]) =>
      (primera.nombre === nombreA && segunda.nombre === nombreB) ||
      (primera.nombre === nombreB && segunda.nombre === nombreA),
  )

/**
 * Elige dos colores distintos al azar que se distingan bien entre sí
 * @param aleatorio Generador de números entre 0 y 1; las pruebas lo reemplazan para ser
 *   deterministas
 * @returns Los dos colores, uno por participante
 * @see RF16, RNF03
 */
export function elegirColoresFichas(
  aleatorio: () => number = Math.random,
): [EstiloFicha, EstiloFicha] {
  const primero = PALETA_FICHAS[Math.floor(aleatorio() * PALETA_FICHAS.length)]
  const opciones = PALETA_FICHAS.filter(
    (opcion) => opcion !== primero && !esParSimilar(primero, opcion),
  )
  return [primero, opciones[Math.floor(aleatorio() * opciones.length)]]
}
