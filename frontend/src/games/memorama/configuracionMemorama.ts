/**
 * Archivo: configuracionMemorama.ts
 * Módulo: frontend / games / memorama
 * Descripción: Lee la categoría y la dificultad de Memorama desde la URL.
 * Requerimientos: RF39, RF40
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import { CATEGORIAS, DIFICULTADES_MEMORAMA, type DificultadMemorama } from '../../data/categorias'
import type { IdCategoria } from '../../types'

// ---------- Tipos ----------
export interface ConfiguracionMemorama {
  categoria: IdCategoria
  dificultad: DificultadMemorama
}

// ---------- Funciones ----------
/**
 * Lee la categoría y la dificultad de la URL.
 * @param parametros Parámetros de búsqueda de la URL
 * @returns Configuración o null si falta o no es válida
 * @see RF39, RF40
 */
export function leerConfiguracionMemorama(
  parametros: URLSearchParams,
): ConfiguracionMemorama | null {
  const categoria = CATEGORIAS.find((opcion) => opcion.id === parametros.get('categoria'))
  const dificultad = DIFICULTADES_MEMORAMA.find(
    (opcion) => opcion.id === parametros.get('dificultad'),
  )
  if (!categoria || !dificultad) {
    return null
  }
  return { categoria: categoria.id, dificultad: dificultad.id }
}
