/**
 * Archivo: avatares.ts
 * Módulo: frontend / data
 * Descripción: Colección predeterminada de avatares del registro.
 * Requerimientos: RF01, RIU01
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import type { IdAvatar } from '../types'

// ---------- Tipos ----------
export interface InfoAvatar {
  id: IdAvatar
  nombre: string
  fondo: string
}

// ---------- Constantes ----------
/** Colección predeterminada de avatares del registro (RF01) */
export const AVATARES: InfoAvatar[] = [
  { id: 'robot', nombre: 'Robot azul', fondo: 'var(--blue-soft)' },
  { id: 'cat', nombre: 'Gato naranja', fondo: 'var(--orange-soft)' },
  { id: 'dino', nombre: 'Dinosaurio verde', fondo: 'var(--mint-soft)' },
  { id: 'fox', nombre: 'Zorro morado', fondo: 'var(--lilac-soft)' },
  { id: 'astronaut', nombre: 'Astronauta blanco', fondo: 'var(--gray-soft)' },
  { id: 'monster', nombre: 'Monstruo amarillo', fondo: 'var(--yellow-soft)' },
]

// ---------- Funciones ----------
/**
 * Busca la información de un avatar de la colección.
 * @param id Avatar buscado
 * @returns Nombre y datos del avatar
 * @see RF01
 */
export function obtenerAvatar(id: IdAvatar): InfoAvatar {
  return AVATARES.find((avatar) => avatar.id === id) ?? AVATARES[0]
}
