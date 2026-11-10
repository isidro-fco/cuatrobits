/**
 * Archivo: rutas.test.tsx
 * Módulo: frontend / tests
 * Descripción: Pruebas del registro, el lobby y la navegación entre pantallas.
 * Requerimientos: RF01, RF05, RF09, RF63
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router'

// ---------- Módulos internos ----------
import { rutasAplicacion } from '../rutas'
import { useJugadorStore } from '../stores/useJugadorStore'

// ---------- Pruebas ----------
beforeEach(() => {
  localStorage.clear()
  useJugadorStore.setState({ perfiles: [], idActivo: null })
})

function renderizarEn(ruta: string) {
  const enrutador = createMemoryRouter(rutasAplicacion, { initialEntries: [ruta] })
  render(<RouterProvider router={enrutador} />)
  return enrutador
}

describe('registro y lobby', () => {
  it('sin perfil lleva al registro y, al crearlo, muestra el lobby', async () => {
    const usuario = userEvent.setup()
    renderizarEn('/')

    expect(await screen.findByRole('heading', { name: '¡Vamos a jugar!' })).toBeInTheDocument()
    await usuario.type(screen.getByLabelText('¿Cómo te llamas?'), 'Luna')
    await usuario.click(screen.getByRole('radio', { name: 'Gato naranja' }))
    await usuario.click(screen.getByRole('button', { name: /Crear perfil y jugar/ }))

    expect(await screen.findByRole('heading', { name: '¡Elige un minijuego!' })).toBeInTheDocument()
    expect(screen.getByText('Luna')).toBeInTheDocument()
    for (const nombre of ['Conecta 4', 'Arma a BitBot', 'Ordenamiento de esferas', 'Memorama']) {
      expect(screen.getByRole('button', { name: nombre })).toBeInTheDocument()
    }
  })

  it('rechaza un nombre repetido sin distinguir mayúsculas', async () => {
    useJugadorStore.getState().agregarPerfil('Luna', 'robot')
    const usuario = userEvent.setup()
    renderizarEn('/registro?nuevo=1')

    await usuario.type(await screen.findByLabelText('¿Cómo te llamas?'), 'LUNA')
    await usuario.click(screen.getByRole('button', { name: /Crear perfil y jugar/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Ese nombre ya está en uso')
    expect(useJugadorStore.getState().perfiles).toHaveLength(1)
  })

  it('el perfil se recupera al recargar la aplicación', async () => {
    useJugadorStore.getState().agregarPerfil('Sol', 'dino')
    renderizarEn('/')
    expect(await screen.findByRole('heading', { name: '¡Elige un minijuego!' })).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('cuatrobits-players')!).state.perfiles[0].username).toBe(
      'Sol',
    )
  })
})

describe('navegación entre pantallas', () => {
  beforeEach(() => {
    useJugadorStore.getState().agregarPerfil('Luna', 'cat')
  })

  it('cada isla abre su juego o su pantalla de preparación', async () => {
    const casos = [
      ['Conecta 4', '/preparar/connect-four'],
      ['Arma a BitBot', '/preparar/bitbot'],
      ['Ordenamiento de esferas', '/preparar/ball-sort'],
      ['Memorama', '/preparar/memory'],
    ] as const
    for (const [isla, ruta] of casos) {
      const usuario = userEvent.setup()
      const enrutador = renderizarEn('/')
      await usuario.click(await screen.findByRole('button', { name: isla }))
      await vi.waitFor(() => expect(enrutador.state.location.pathname).toBe(ruta))
      cleanup()
    }
  })

  it('se puede salir al lobby desde un juego', async () => {
    const usuario = userEvent.setup()
    const enrutador = renderizarEn('/juego/memory?categoria=animals&dificultad=easy')
    await usuario.click(await screen.findByRole('button', { name: /Salir al lobby/ }))
    expect(enrutador.state.location.pathname).toBe('/')
  })

  it.each([
    ['/preparar/bitbot', 'Arma a BitBot', 'Memorama'],
    ['/preparar/memory', 'Memorama', 'Arma a BitBot'],
  ])('%s muestra solo el juego elegido, sin opciones para cambiarlo', async (ruta, juego, otro) => {
    renderizarEn(ruta)
    expect(
      await screen.findByRole('heading', { name: `¡Preparemos ${juego}!` }),
    ).toBeInTheDocument()
    expect(screen.queryByText(otro)).not.toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
  })

  it('en BitBot solo se pueden elegir las categorías de la dificultad elegida', async () => {
    const usuario = userEvent.setup()
    const enrutador = renderizarEn('/preparar/bitbot')
    expect(await screen.findByRole('button', { name: /Espacio/ })).toBeDisabled()
    await usuario.click(screen.getByRole('button', { name: /Difícil/ }))
    await usuario.click(screen.getByRole('button', { name: /Espacio/ }))
    await usuario.click(screen.getByRole('button', { name: /Comenzar partida/ }))
    expect(enrutador.state.location.pathname).toBe('/juego/bitbot')
    expect(enrutador.state.location.search).toBe('?categoria=space&dificultad=hard')
  })

  it('Conecta 4 permite elegir el modo y la dificultad de la IA', async () => {
    const usuario = userEvent.setup()
    const enrutador = renderizarEn('/preparar/connect-four')
    await usuario.click(await screen.findByRole('button', { name: /Difícil/ }))
    await usuario.click(screen.getByRole('button', { name: /Comenzar partida/ }))
    expect(enrutador.state.location.search).toBe('?modo=ia&dificultad=hard')
  })

  it('un juego sin configuración válida regresa a su pantalla de preparación', async () => {
    const enrutador = renderizarEn('/juego/bitbot?categoria=space&dificultad=easy')
    await vi.waitFor(() => expect(enrutador.state.location.pathname).toBe('/preparar/bitbot'))
  })

  it('la configuración de esferas muestra los tubos según la fórmula', async () => {
    const usuario = userEvent.setup()
    renderizarEn('/preparar/ball-sort')
    await usuario.click(await screen.findByRole('button', { name: '10 colores' }))
    expect(screen.getByText('12 tubos')).toBeInTheDocument()
  })
})
