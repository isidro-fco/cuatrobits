/**
 * Archivo: categorias.ts
 * Módulo: frontend / data
 * Descripción: Categorías y dificultades compartidas por Arma a BitBot y Memorama.
 * Requerimientos: RF24, RF39, RF40, RIU05
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import type { IdCategoria, Dificultad } from '../types'

// ---------- Tipos ----------
export interface InfoCategoria {
  id: IdCategoria
  nombre: string
  emoji: string
  fondo: string
  /** Dificultad de Arma a BitBot a la que pertenece la categoría (sección 6.2) */
  dificultadBitBot: Dificultad
}

export interface OpcionDificultad<TipoDato extends string> {
  id: TipoDato
  nombre: string
  descripcion: string
  color: string
}

export type DificultadMemorama = 'easy' | 'normal' | 'hard' | 'expert'

// ---------- Constantes ----------
/** Categorías de contenido compartidas por Arma a BitBot y Memorama */
export const CATEGORIAS: InfoCategoria[] = [
  {
    id: 'animals',
    nombre: 'Animales',
    emoji: '🐶',
    fondo: 'var(--blue-soft)',
    dificultadBitBot: 'easy',
  },
  {
    id: 'colors',
    nombre: 'Colores',
    emoji: '🎨',
    fondo: 'var(--yellow-soft)',
    dificultadBitBot: 'easy',
  },
  {
    id: 'fruits',
    nombre: 'Frutas',
    emoji: '🍎',
    fondo: 'var(--orange-soft)',
    dificultadBitBot: 'easy',
  },
  {
    id: 'school',
    nombre: 'Escuela',
    emoji: '✏️',
    fondo: 'var(--lilac-soft)',
    dificultadBitBot: 'medium',
  },
  {
    id: 'transport',
    nombre: 'Transportes',
    emoji: '🚲',
    fondo: 'var(--mint-soft)',
    dificultadBitBot: 'medium',
  },
  {
    id: 'nature',
    nombre: 'Naturaleza',
    emoji: '🌳',
    fondo: 'var(--yellow-soft)',
    dificultadBitBot: 'medium',
  },
  {
    id: 'space',
    nombre: 'Espacio',
    emoji: '🚀',
    fondo: 'var(--lilac-soft)',
    dificultadBitBot: 'hard',
  },
  {
    id: 'technology',
    nombre: 'Tecnología',
    emoji: '💻',
    fondo: 'var(--blue-soft)',
    dificultadBitBot: 'hard',
  },
]

/** Dificultades de Arma a BitBot con sus categorías (sección 6.2) */
export const DIFICULTADES_BITBOT: OpcionDificultad<Dificultad>[] = [
  { id: 'easy', nombre: 'Fácil', descripcion: 'Para comenzar', color: 'var(--mint)' },
  { id: 'medium', nombre: 'Medio', descripcion: 'Un reto equilibrado', color: 'var(--blue)' },
  {
    id: 'hard',
    nombre: 'Difícil',
    descripcion: 'Pon a prueba tus habilidades',
    color: 'var(--orange)',
  },
]

/** Dificultades de Memorama con el tamaño de su tablero (sección 8.3) */
export const DIFICULTADES_MEMORAMA: (OpcionDificultad<DificultadMemorama> & {
  columnas: number
  filas: number
})[] = [
  {
    id: 'easy',
    nombre: 'Fácil',
    descripcion: '4 parejas · 4 × 2',
    color: 'var(--mint)',
    columnas: 4,
    filas: 2,
  },
  {
    id: 'normal',
    nombre: 'Normal',
    descripcion: '8 parejas · 4 × 4',
    color: 'var(--blue)',
    columnas: 4,
    filas: 4,
  },
  {
    id: 'hard',
    nombre: 'Difícil',
    descripcion: '12 parejas · 6 × 4',
    color: 'var(--orange)',
    columnas: 6,
    filas: 4,
  },
  {
    id: 'expert',
    nombre: 'Experto',
    descripcion: '18 parejas · 6 × 6',
    color: 'var(--lilac)',
    columnas: 6,
    filas: 6,
  },
]
