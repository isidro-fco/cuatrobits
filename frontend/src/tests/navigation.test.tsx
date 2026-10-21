import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '../routes'
import { usePlayerStore } from '../stores/playerStore'

beforeEach(() => {
  localStorage.clear()
  usePlayerStore.setState({ profiles: [], activeId: null })
})

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

describe('registro y lobby', () => {
  it('sin perfil lleva al registro y, al crearlo, muestra el lobby', async () => {
    const user = userEvent.setup()
    renderAt('/')

    expect(await screen.findByRole('heading', { name: '¡Vamos a jugar!' })).toBeInTheDocument()
    await user.type(screen.getByLabelText('¿Cómo te llamas?'), 'Luna')
    await user.click(screen.getByRole('radio', { name: 'Gato naranja' }))
    await user.click(screen.getByRole('button', { name: /Crear perfil y jugar/ }))

    expect(await screen.findByRole('heading', { name: '¡Elige un minijuego!' })).toBeInTheDocument()
    expect(screen.getByText('Luna')).toBeInTheDocument()
    for (const name of ['Conecta 4', 'Arma a BitBot', 'Ordenamiento de esferas', 'Memorama']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
  })

  it('rechaza un nombre repetido sin distinguir mayúsculas', async () => {
    usePlayerStore.getState().addProfile('Luna', 'robot')
    const user = userEvent.setup()
    renderAt('/registro?nuevo=1')

    await user.type(await screen.findByLabelText('¿Cómo te llamas?'), 'LUNA')
    await user.click(screen.getByRole('button', { name: /Crear perfil y jugar/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Ese nombre ya está en uso')
    expect(usePlayerStore.getState().profiles).toHaveLength(1)
  })

  it('el perfil se recupera al recargar la aplicación', async () => {
    usePlayerStore.getState().addProfile('Sol', 'dino')
    renderAt('/')
    expect(await screen.findByRole('heading', { name: '¡Elige un minijuego!' })).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('cuatrobits-players')!).state.profiles[0].username).toBe('Sol')
  })
})

describe('navegación entre pantallas', () => {
  beforeEach(() => {
    usePlayerStore.getState().addProfile('Luna', 'cat')
  })

  it('cada isla abre su juego o su pantalla de preparación', async () => {
    const cases = [
      ['Conecta 4', '/preparar/connect-four'],
      ['Arma a BitBot', '/preparar/bitbot'],
      ['Ordenamiento de esferas', '/preparar/ball-sort'],
      ['Memorama', '/preparar/memory'],
    ] as const
    for (const [island, path] of cases) {
      const user = userEvent.setup()
      const router = renderAt('/')
      await user.click(await screen.findByRole('button', { name: island }))
      await vi.waitFor(() => expect(router.state.location.pathname).toBe(path))
      cleanup()
    }
  })

  it('se puede salir al lobby desde un juego', async () => {
    const user = userEvent.setup()
    const router = renderAt('/juego/memory?categoria=animals&dificultad=easy')
    await user.click(await screen.findByRole('button', { name: /Salir al lobby/ }))
    expect(router.state.location.pathname).toBe('/')
  })

  it.each([
    ['/preparar/bitbot', 'Arma a BitBot', 'Memorama'],
    ['/preparar/memory', 'Memorama', 'Arma a BitBot'],
  ])('%s muestra solo el juego elegido, sin opciones para cambiarlo', async (path, game, other) => {
    renderAt(path)
    expect(await screen.findByRole('heading', { name: `¡Preparemos ${game}!` })).toBeInTheDocument()
    expect(screen.queryByText(other)).not.toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
  })

  it('en BitBot solo se pueden elegir las categorías de la dificultad elegida', async () => {
    const user = userEvent.setup()
    const router = renderAt('/preparar/bitbot')
    expect(await screen.findByRole('button', { name: /Espacio/ })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: /Difícil/ }))
    await user.click(screen.getByRole('button', { name: /Espacio/ }))
    await user.click(screen.getByRole('button', { name: /Comenzar partida/ }))
    expect(router.state.location.pathname).toBe('/juego/bitbot')
    expect(router.state.location.search).toBe('?categoria=space&dificultad=hard')
  })

  it('Conecta 4 permite elegir el modo y la dificultad de la IA', async () => {
    const user = userEvent.setup()
    const router = renderAt('/preparar/connect-four')
    await user.click(await screen.findByRole('button', { name: /Difícil/ }))
    await user.click(screen.getByRole('button', { name: /Comenzar partida/ }))
    expect(router.state.location.search).toBe('?modo=ia&dificultad=hard')
  })

  it('un juego sin configuración válida regresa a su pantalla de preparación', async () => {
    const router = renderAt('/juego/bitbot?categoria=space&dificultad=easy')
    await vi.waitFor(() => expect(router.state.location.pathname).toBe('/preparar/bitbot'))
  })

  it('la configuración de esferas muestra los tubos según la fórmula', async () => {
    const user = userEvent.setup()
    renderAt('/preparar/ball-sort')
    await user.click(await screen.findByRole('button', { name: '10 colores' }))
    expect(screen.getByText('12 tubos')).toBeInTheDocument()
  })
})
