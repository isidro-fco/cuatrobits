/**
 * Archivo: configuracionPruebas.ts
 * Módulo: frontend / tests
 * Descripción: Configuración global de Vitest y Testing Library para el frontend.
 * Requerimientos: RNF15, RDC05
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

// ---------- Módulos internos ----------
import { apiFalsa, solicitudFalsa } from './apiFalsa'

// ---------- Funciones ----------
// findBy* espera 1 s por defecto; con el backend probándose en paralelo la página puede tardar más
configure({ asyncUtilTimeout: 5_000 })

afterEach(cleanup)

// Todas las pruebas hablan con un servidor falso en memoria
beforeEach(() => {
  apiFalsa.restablecer()
  vi.stubGlobal('fetch', solicitudFalsa)
})

// jsdom no implementa matchMedia ni los métodos de <dialog>
window.matchMedia ??= (consulta: string) =>
  ({
    matches: false,
    media: consulta,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList

HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.open = true
}
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  this.open = false
}
