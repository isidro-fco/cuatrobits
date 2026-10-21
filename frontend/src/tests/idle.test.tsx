import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { IDLE_MS } from '../components/IdleScreen'
import { routes } from '../routes'
import { usePlayerStore } from '../stores/playerStore'

beforeEach(() => {
  localStorage.clear()
  usePlayerStore.setState({ profiles: [], activeId: null })
  usePlayerStore.getState().addProfile('Luna', 'cat', crypto.randomUUID())
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

function renderAt(path: string) {
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />)
}

const idleScreen = () => document.querySelector<HTMLDialogElement>('dialog.idle-screen')!

function wait(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

describe('protector de pantalla por inactividad', () => {
  it('a los 30 s sin actividad muestra solo el fondo animado y el logotipo', () => {
    renderAt('/historial')
    wait(IDLE_MS - 1)
    expect(idleScreen().open).toBe(false)
    wait(1)
    expect(idleScreen().open).toBe(true)
    expect(idleScreen().querySelector('.background--animated')).not.toBeNull()
    expect(idleScreen()).toHaveTextContent('CuatroBits')
  })

  it('cualquier toque o tecla lo cierra y vuelve a contar desde cero', () => {
    renderAt('/')
    wait(IDLE_MS)
    fireEvent.keyDown(idleScreen(), { key: 'a' })
    expect(idleScreen().open).toBe(false)

    wait(IDLE_MS - 1000)
    fireEvent.pointerDown(document.body)
    wait(IDLE_MS - 1000)
    expect(idleScreen().open).toBe(false)
    wait(1000)
    expect(idleScreen().open).toBe(true)
    fireEvent.pointerDown(idleScreen())
    expect(idleScreen().open).toBe(false)
  })

  it('un movimiento mínimo del puntero no lo cierra, uno real sí', () => {
    renderAt('/')
    wait(IDLE_MS)
    fireEvent.pointerMove(idleScreen(), { clientX: 100, clientY: 100 })
    fireEvent.pointerMove(idleScreen(), { clientX: 104, clientY: 103 })
    expect(idleScreen().open).toBe(true)
    fireEvent.pointerMove(idleScreen(), { clientX: 160, clientY: 100 })
    expect(idleScreen().open).toBe(false)
  })

  it('no aparece durante una partida', () => {
    renderAt('/juego/connect-four?modo=local')
    wait(IDLE_MS * 3)
    expect(screen.getByRole('button', { name: /pausa/i })).toBeInTheDocument()
    expect(idleScreen().open).toBe(false)
  })
})
