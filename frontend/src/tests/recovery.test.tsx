import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '../routes'
import { syncPendingGames } from '../services/syncService'
import { useHistoryStore } from '../stores/historyStore'
import { usePlayerStore } from '../stores/playerStore'
import type { GameRecord } from '../types'
import { fakeApi } from './fakeApi'

beforeEach(() => {
  localStorage.clear()
  usePlayerStore.setState({ profiles: [], activeId: null })
  useHistoryStore.setState({ records: [] })
})

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

const player = () => usePlayerStore.getState().profiles[0]

function serverGame(playerId: string, overrides: Partial<GameRecord> = {}): Omit<GameRecord, 'syncStatus'> {
  return {
    id: crypto.randomUUID(),
    playerId,
    game: 'memory',
    result: 'completed',
    durationMs: 30_000,
    xpEarned: 20,
    bitsEarned: 5,
    summary: 'Frutas · Fácil · 5 intentos',
    details: { category: 'fruits', difficulty: 'easy', pairs: 4, attempts: 5 },
    playedAt: '2026-10-01T10:00:00.000Z',
    ...overrides,
  }
}

/** Un jugador que ya existe en el servidor con dos partidas */
function seedServer() {
  const id = crypto.randomUUID()
  fakeApi.players.set(id, { id, username: 'Luna', avatar: 'fox' })
  fakeApi.codes.set(id, 'K7QM-4TZP')
  const games = [serverGame(id), serverGame(id, { playedAt: '2026-10-02T10:00:00.000Z' })]
  for (const g of games) fakeApi.games.set(g.id, g)
  return { id, games }
}

async function fillRecovery(username: string, code: string) {
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('Tu nombre de jugador'), username)
  await user.type(screen.getByLabelText('Tu código secreto'), code)
  await user.click(screen.getByRole('button', { name: /Recuperar mi perfil/ }))
  return user
}

describe('código secreto al crear el perfil', () => {
  it('el lobby lo muestra una vez y después queda en el perfil', async () => {
    const user = userEvent.setup()
    const router = renderAt('/registro')
    await user.type(await screen.findByLabelText('¿Cómo te llamas?'), 'Sol')
    await user.click(screen.getByRole('button', { name: /Crear perfil y jugar/ }))

    expect(await screen.findByRole('heading', { name: '¡Guarda tu código secreto!' })).toBeInTheDocument()
    expect(screen.getByLabelText(/^Código secreto:/)).toHaveTextContent('C0DE-0001')
    await user.click(screen.getByRole('button', { name: 'Ya lo guardé' }))
    expect(player()).toMatchObject({ recoveryCode: 'C0DE-0001', recoveryCodeSeen: true })
    expect(screen.queryByRole('heading', { name: '¡Guarda tu código secreto!' })).not.toBeInTheDocument()

    // En el perfil está oculto hasta pedirlo
    await router.navigate('/perfil')
    expect(screen.queryByText('C0DE-0001')).not.toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: 'Mostrar mi código secreto' }))
    expect(screen.getByText('C0DE-0001')).toBeInTheDocument()
  })

  it('los perfiles creados antes pueden pedir su código una sola vez', async () => {
    const id = crypto.randomUUID()
    fakeApi.players.set(id, { id, username: 'Mar', avatar: 'dino' })
    usePlayerStore.getState().addProfile('Mar', 'dino', id)
    const user = userEvent.setup()
    renderAt('/perfil')
    await user.click(await screen.findByRole('button', { name: 'Crear mi código secreto' }))
    expect(await screen.findByText('NUEV-0C0D')).toBeInTheDocument()
    expect(player().recoveryCode).toBe('NUEV-0C0D')
  })

  it('si el código ya existe en otro dispositivo, lo explica', async () => {
    const id = crypto.randomUUID()
    fakeApi.players.set(id, { id, username: 'Mar', avatar: 'dino' })
    fakeApi.codes.set(id, 'OTRO-C0D1')
    usePlayerStore.getState().addProfile('Mar', 'dino', id)
    const user = userEvent.setup()
    renderAt('/perfil')
    await user.click(await screen.findByRole('button', { name: 'Crear mi código secreto' }))
    expect(await screen.findByText(/ya tiene un código/)).toBeInTheDocument()
  })

  it('un perfil antiguo recibe su código al registrarse durante la sincronización', async () => {
    usePlayerStore.getState().addProfile('Rio', 'cat')
    useHistoryStore.getState().addRecord({ ...serverGame(player().id), syncStatus: 'pending' })
    await syncPendingGames()
    expect(player()).toMatchObject({ registered: true, recoveryCode: 'C0DE-0001' })
    expect(player().recoveryCodeSeen).toBeFalsy()
  })
})

describe('recuperar un perfil', () => {
  it('en un dispositivo nuevo trae el perfil, el progreso y el historial', async () => {
    const { id, games } = seedServer()
    const router = renderAt('/registro')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('link', { name: /Recupéralo/ }))
    await fillRecovery('luna', 'k7qm 4tzp')

    await vi.waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(player()).toMatchObject({
      id,
      username: 'Luna',
      avatar: 'fox',
      xp: 40,
      bits: 10,
      registered: true,
      recoveryCode: 'K7QM-4TZP',
      recoveryCodeSeen: true,
    })
    const records = useHistoryStore.getState().records
    expect(records.map((r) => r.id)).toEqual([games[1].id, games[0].id])
    expect(records.every((r) => r.syncStatus === 'synced')).toBe(true)
    // No aparece el aviso del código: el jugador ya lo conoce
    expect(screen.queryByRole('heading', { name: '¡Guarda tu código secreto!' })).not.toBeInTheDocument()
  })

  it('con un código incorrecto muestra el error del servidor', async () => {
    seedServer()
    renderAt('/recuperar')
    await fillRecovery('Luna', 'AAAA-BBBB')
    expect(await screen.findByRole('alert')).toHaveTextContent('El nombre o el código secreto no son correctos.')
    expect(usePlayerStore.getState().profiles).toEqual([])
  })

  it('si el perfil ya estaba en el dispositivo no duplica partidas ni pierde lo pendiente', async () => {
    const { id, games } = seedServer()
    usePlayerStore.getState().addProfile('Luna', 'fox', id)
    usePlayerStore.getState().addRewards(id, { xp: 60, bits: 15 })
    const pending = { ...serverGame(id), syncStatus: 'pending' as const }
    useHistoryStore.setState({ records: [{ ...games[0], syncStatus: 'synced' }, pending] })

    renderAt('/recuperar')
    await fillRecovery('Luna', 'K7QM-4TZP')

    await vi.waitFor(() => expect(player().recoveryCode).toBe('K7QM-4TZP'))
    expect(usePlayerStore.getState().profiles).toHaveLength(1)
    expect(player()).toMatchObject({ xp: 60, bits: 15 })
    const ids = useHistoryStore.getState().records.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toEqual(expect.arrayContaining([games[0].id, games[1].id, pending.id]))
  })
})
