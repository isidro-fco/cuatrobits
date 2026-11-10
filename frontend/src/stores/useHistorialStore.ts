/**
 * Archivo: useHistorialStore.ts
 * Módulo: frontend / stores
 * Descripción: Store del historial local de partidas guardado en localStorage.
 * Requerimientos: RF50, RF52, RF54, RDC03, RIE03
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ---------- Módulos internos ----------
import type { Partida, EstadoSync } from '../types'
import { traducirClaves } from '../utils/clavesAnteriores'

// ---------- Tipos ----------
interface EstadoHistorial {
  registros: Partida[]
  agregarRegistro: (registro: Partida) => void
  /** Agrega las partidas recuperadas que no estén ya en el historial */
  combinarRegistros: (registros: Partida[]) => void
  asignarEstadoSincronizacion: (
    actualizaciones: Map<string, { estatus: EstadoSync; error?: string }>,
  ) => void
}

// ---------- Store useHistorialStore ----------
// Historial local. Cada partida se guarda aquí primero y después se sincroniza (sección 4.3).
export const useHistorialStore = create<EstadoHistorial>()(
  persist(
    (set) => ({
      registros: [],
      agregarRegistro: (registro) =>
        set((estado) => ({ registros: [registro, ...estado.registros] })),
      combinarRegistros: (entrantes) =>
        set((estado) => {
          const conocidos = new Set(estado.registros.map((registro) => registro.id))
          const nuevos = entrantes.filter((registro) => !conocidos.has(registro.id))
          if (nuevos.length === 0) {
            return estado
          }
          return {
            registros: [...estado.registros, ...nuevos].sort((primero, segundo) =>
              segundo.jugadaEn.localeCompare(primero.jugadaEn),
            ),
          }
        }),
      asignarEstadoSincronizacion: (actualizaciones) =>
        set((estado) => ({
          registros: estado.registros.map((registro) => {
            const actualizar = actualizaciones.get(registro.id)
            return actualizar
              ? {
                  ...registro,
                  estadoSincronizacion: actualizar.estatus,
                  errorSincronizacion: actualizar.error,
                }
              : registro
          }),
        })),
    }),
    {
      name: 'cuatrobits-history',
      // Versión 2 (estándar de codificación): las claves guardadas pasan al español
      version: 2,
      migrate: (persistido, version) =>
        (version < 2 ? traducirClaves(persistido) : persistido) as EstadoHistorial,
    },
  ),
)
