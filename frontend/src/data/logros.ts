/**
 * Archivo: logros.ts
 * Módulo: frontend / data
 * Descripción: Catálogo de logros que se muestra en el perfil.
 * Requerimientos: RF48, RIU03
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import type { NombreGlifo } from './glifosPixel'

// ---------- Tipos ----------
export interface Logro {
  id: string
  nombre: string
  descripcion: string
  icono: NombreGlifo
  fondo: string
}

// ---------- Constantes ----------
// Debe coincidir con database/seeds/001_logros.sql
export const LOGROS: Logro[] = [
  {
    id: 'first-game',
    nombre: 'Primera partida',
    descripcion: 'Completa tu primera partida.',
    icono: 'star',
    fondo: 'var(--yellow-soft)',
  },
  {
    id: 'first-win',
    nombre: 'Primera victoria',
    descripcion: 'Gana tu primera partida.',
    icono: 'diamond',
    fondo: 'var(--blue-soft)',
  },
  {
    id: 'five-games',
    nombre: 'Jugador constante',
    descripcion: 'Completa cinco partidas.',
    icono: 'triangle',
    fondo: 'var(--orange-soft)',
  },
  {
    id: 'win-each-game',
    nombre: 'Gran explorador',
    descripcion: 'Gana al menos una vez en cada juego.',
    icono: 'diamondOutline',
    fondo: 'var(--orange-soft)',
  },
  {
    id: 'bitbot-10',
    nombre: 'Constructor experto',
    descripcion: 'Adivina diez palabras en Arma a BitBot.',
    icono: 'grid',
    fondo: 'var(--mint-soft)',
  },
  {
    id: 'ball-sort-5',
    nombre: 'Maestro de las esferas',
    descripcion: 'Completa cinco niveles de esferas.',
    icono: 'circle',
    fondo: 'var(--mint-soft)',
  },
  {
    id: 'memory-10',
    nombre: 'Memoria brillante',
    descripcion: 'Encuentra diez parejas en Memorama.',
    icono: 'squareInSquare',
    fondo: 'var(--lilac-soft)',
  },
]
