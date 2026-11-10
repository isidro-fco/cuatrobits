/**
 * Archivo: configuracionBitBot.ts
 * Módulo: frontend / games / bitbot
 * Descripción: Lee la configuración de Arma a BitBot (categoría y dificultad) desde la URL.
 * Requerimientos: RF24, RIU05
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import { CATEGORIAS } from '../../data/categorias'
import type { IdCategoria, Dificultad } from '../../types'

// ---------- Tipos ----------
export interface ConfiguracionBitBot {
  categoria: IdCategoria
  dificultad: Dificultad
}

// ---------- Funciones ----------
/**
 * Lee la configuración de la URL; la categoría debe pertenecer a la dificultad (sección 6.2)
 * @param parametros Parámetros de búsqueda de la URL
 * @returns Categoría y dificultad, o null si no son válidas
 * @see RF24, RIU05
 */
export function leerConfiguracionBitBot(parametros: URLSearchParams): ConfiguracionBitBot | null {
  const categoria = CATEGORIAS.find((opcion) => opcion.id === parametros.get('categoria'))
  const dificultad = parametros.get('dificultad')
  if (!categoria || categoria.dificultadBitBot !== dificultad) {
    return null
  }
  return { categoria: categoria.id, dificultad: categoria.dificultadBitBot }
}
