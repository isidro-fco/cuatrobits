/**
 * Archivo: configuracionEsferas.ts
 * Módulo: frontend / games / esferas
 * Descripción: Lee la cantidad de colores de Ordenamiento de esferas desde la URL.
 * Requerimientos: RF31, RIU06
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import { MAX_COLORES, MIN_COLORES } from '../../data/esferas'

// ---------- Tipos ----------
export interface ConfiguracionEsferas {
  colores: number
}

// ---------- Funciones ----------
/**
 * Lee la cantidad de colores de la URL; `null` si falta o está fuera del rango 1–10
 * @param parametros Parámetros de búsqueda de la URL
 * @returns Cantidad de colores o null
 * @see RF31, RIU06
 */
export function leerConfiguracionEsferas(parametros: URLSearchParams): ConfiguracionEsferas | null {
  const valorCrudo = parametros.get('colores')
  const colores = Number(valorCrudo)
  if (!valorCrudo || !Number.isInteger(colores) || colores < MIN_COLORES || colores > MAX_COLORES) {
    return null
  }
  return { colores }
}
