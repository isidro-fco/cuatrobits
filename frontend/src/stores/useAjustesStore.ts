/**
 * Archivo: useAjustesStore.ts
 * Módulo: frontend / stores
 * Descripción: Store de preferencias (música, efectos, animaciones y cronómetro) guardado en
 *              localStorage.
 * Requerimientos: RF03, RF08, RDC03, RIE03
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ---------- Módulos internos ----------
import type { Ajustes } from '../types'
import { traducirClaves } from '../utils/clavesAnteriores'

// ---------- Tipos ----------
interface EstadoAjustes extends Ajustes {
  alternar: (clave: keyof Ajustes) => void
}

// ---------- Store useAjustesStore ----------
/** Store de preferencias, guardado en localStorage (RF03, RF08) */
export const useAjustesStore = create<EstadoAjustes>()(
  persist(
    (set) => ({
      estaMusicaActiva: true,
      estaSonidoActivo: true,
      esMovimientoReducido: false,
      esCronometroVisible: true,
      alternar: (clave) => set((estado) => ({ [clave]: !estado[clave] })),
    }),
    {
      name: 'cuatrobits-settings',
      // Versión 2 (estándar de codificación): las claves guardadas pasan al español
      version: 2,
      migrate: (persistido, version) =>
        (version < 2 ? traducirClaves(persistido) : persistido) as EstadoAjustes,
    },
  ),
)
