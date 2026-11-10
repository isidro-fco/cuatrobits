/**
 * Archivo: PantallaInactividad.test.tsx
 * Módulo: frontend / tests
 * Descripción: Pruebas del protector de pantalla por inactividad.
 * Requerimientos: RNF04
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router'

// ---------- Módulos internos ----------
import { INACTIVIDAD_MS, SALIDA_MS } from '../components/PantallaInactividad'
import { rutasAplicacion } from '../rutas'
import { useJugadorStore } from '../stores/useJugadorStore'

// ---------- Pruebas ----------
beforeEach(() => {
  localStorage.clear()
  useJugadorStore.setState({ perfiles: [], idActivo: null })
  useJugadorStore.getState().agregarPerfil('Luna', 'cat', crypto.randomUUID())
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

function renderizarEn(ruta: string) {
  render(
    <RouterProvider router={createMemoryRouter(rutasAplicacion, { initialEntries: [ruta] })} />,
  )
}

const pantallaInactividad = () => document.querySelector<HTMLDialogElement>('dialog.idle-screen')!

function esperar(milisegundos: number) {
  act(() => {
    vi.advanceTimersByTime(milisegundos)
  })
}

describe('protector de pantalla por inactividad', () => {
  it('a los 30 s sin actividad muestra solo el fondo animado y el logotipo', () => {
    renderizarEn('/historial')
    esperar(INACTIVIDAD_MS - 1)
    expect(pantallaInactividad().open).toBe(false)
    esperar(1)
    expect(pantallaInactividad().open).toBe(true)
    expect(pantallaInactividad().querySelector('.background--animated')).not.toBeNull()
    expect(pantallaInactividad()).toHaveTextContent('CuatroBits')
  })

  it('cualquier toque o tecla lo cierra y vuelve a contar desde cero', () => {
    renderizarEn('/')
    esperar(INACTIVIDAD_MS)
    fireEvent.keyDown(pantallaInactividad(), { key: 'a' })
    expect(pantallaInactividad()).toHaveClass('idle-screen--leaving')
    expect(pantallaInactividad().open).toBe(true)
    esperar(SALIDA_MS)
    expect(pantallaInactividad().open).toBe(false)
    expect(pantallaInactividad()).not.toHaveClass('idle-screen--leaving')

    esperar(INACTIVIDAD_MS - 1000)
    fireEvent.pointerDown(document.body)
    esperar(INACTIVIDAD_MS - 1000)
    expect(pantallaInactividad().open).toBe(false)
    esperar(1000)
    expect(pantallaInactividad().open).toBe(true)
    fireEvent.pointerDown(pantallaInactividad())
    esperar(SALIDA_MS)
    expect(pantallaInactividad().open).toBe(false)
  })

  it('un movimiento mínimo del puntero no lo cierra, uno real sí', () => {
    renderizarEn('/')
    esperar(INACTIVIDAD_MS)
    fireEvent.pointerMove(pantallaInactividad(), { clientX: 100, clientY: 100 })
    fireEvent.pointerMove(pantallaInactividad(), { clientX: 104, clientY: 103 })
    expect(pantallaInactividad().open).toBe(true)
    fireEvent.pointerMove(pantallaInactividad(), { clientX: 160, clientY: 100 })
    esperar(SALIDA_MS)
    expect(pantallaInactividad().open).toBe(false)
  })

  it('no aparece durante una partida', () => {
    renderizarEn('/juego/connect-four?modo=local')
    esperar(INACTIVIDAD_MS * 3)
    expect(screen.getByRole('button', { name: /pausa/i })).toBeInTheDocument()
    expect(pantallaInactividad().open).toBe(false)
  })
})
