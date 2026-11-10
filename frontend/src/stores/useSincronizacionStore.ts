/**
 * Archivo: useSincronizacionStore.ts
 * Módulo: frontend / stores
 * Descripción: Store con el estado de la última sincronización.
 * Requerimientos: RF52, RF55, RDC03
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { create } from 'zustand'

// ---------- Tipos ----------
export type EstadoSincronizacion = 'idle' | 'syncing' | 'offline'

interface EstadoStoreSincronizacion {
  estado: EstadoSincronizacion
  ultimaSincronizacion: string | null
  set: (
    cambios: Partial<Pick<EstadoStoreSincronizacion, 'estado' | 'ultimaSincronizacion'>>,
  ) => void
}

// ---------- Store useSincronizacionStore ----------
// Estado de la conexión con el servidor; no se guarda en localStorage
export const useSincronizacionStore = create<EstadoStoreSincronizacion>()((set) => ({
  estado: 'idle',
  ultimaSincronizacion: null,
  set: (cambios) => set(cambios),
}))
