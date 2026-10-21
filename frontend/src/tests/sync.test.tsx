import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '../routes'
import { syncPendingGames } from '../services/syncService'
import { useHistoryStore } from '../stores/historyStore'
import { usePlayerStore } from '../stores/playerStore'
import { useSyncStore } from '../stores/syncStore'
import type { GameRecord } from '../types'
import { fakeApi } from './fakeApi'

beforeEach(() => {
  localStorage.clear()
  usePlayerStore.setState({ profiles: [], activeId: null })
  useHistoryStore.setState({ records: [] })
  useSyncStore.setState({ state: 'idle', lastSyncedAt: null })
})

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

function record(playerId: string, overrides: Partial<GameRecord> = {}): GameRecord {
  return {
    id: crypto.randomUUID(),
    playerId,
    game: 'memory',
    result: 'completed',
    durationMs: 30_000,
    xpEarned: 20,
    summary: 'Frutas · Fácil · 5 intentos',
    details: { category: 'fruits', difficulty: 'easy', pairs: 4, attempts: 5 },
    playedAt: new Date().toISOString(),
    syncStatus: 'pending',
    ...overrides,
  }
}

const statuses = () => useHistoryStore.getState().records.map((r) => r.syncStatus)

describe('registro con el servidor (sección 4.1)', () => {
  it('el servidor asigna el identificador del perfil', async () => {
    const user = userEvent.setup()
    renderAt('/registro')
    await user.type(await screen.findByLabelText('¿Cómo te llamas?'), 'Luna')
    await user.click(screen.getByRole('button', { name: /Crear perfil y jugar/ }))
    await screen.findByRole('heading', { name: '¡Elige un minijuego!' })

    const [serverPlayer] = fakeApi.players.values()
    const [profile] = usePlayerStore.getState().profiles
    expect(profile).toMatchObject({ id: serverPlayer.id, username: 'Luna', registered: true })
  })

  it('rechaza un nombre que otro dispositivo ya registró', async () => {
    fakeApi.players.set('otro', { id: 'otro', username: 'luna', avatar: 'cat' })
    const user = userEvent.setup()
    renderAt('/registro')
    await user.type(await screen.findByLabelText('¿Cómo te llamas?'), 'LUNA')
    await user.click(screen.getByRole('button', { name: /Crear perfil y jugar/ }))
    expect(await screen.findByText('Ese nombre ya está en uso. ¡Prueba con otro!')).toBeInTheDocument()
    expect(usePlayerStore.getState().profiles).toHaveLength(0)
  })

  it('sin conexión avisa y no crea el perfil', async () => {
    fakeApi.offline = true
    const user = userEvent.setup()
    renderAt('/registro')
    await user.type(await screen.findByLabelText('¿Cómo te llamas?'), 'Luna')
    await user.click(screen.getByRole('button', { name: /Crear perfil y jugar/ }))
    expect(await screen.findByText(/No pudimos conectar con el servidor/)).toBeInTheDocument()
    expect(usePlayerStore.getState().profiles).toHaveLength(0)
    expect(screen.getByRole('button', { name: /Crear perfil y jugar/ })).toBeEnabled()
  })
})

describe('sincronización de partidas (sección 13.4)', () => {
  function registeredPlayer() {
    const player = usePlayerStore.getState().addProfile('Luna', 'cat', crypto.randomUUID())
    fakeApi.players.set(player.id, { id: player.id, username: 'Luna', avatar: 'cat' })
    return player
  }

  it('envía las pendientes y las marca como sincronizadas', async () => {
    const player = registeredPlayer()
    useHistoryStore.setState({ records: [record(player.id), record(player.id)] })
    await syncPendingGames()
    expect(statuses()).toEqual(['synced', 'synced'])
    expect(fakeApi.games.size).toBe(2)
    expect(useSyncStore.getState()).toMatchObject({ state: 'idle' })
  })

  it('sin conexión las partidas siguen pendientes y se envían al reconectar', async () => {
    const player = registeredPlayer()
    useHistoryStore.setState({ records: [record(player.id)] })
    fakeApi.offline = true
    await syncPendingGames()
    expect(statuses()).toEqual(['pending'])
    expect(useSyncStore.getState().state).toBe('offline')

    fakeApi.offline = false
    await syncPendingGames()
    expect(statuses()).toEqual(['synced'])
  })

  it('reintentar no duplica partidas en el servidor', async () => {
    const player = registeredPlayer()
    const game = record(player.id)
    useHistoryStore.setState({ records: [game] })
    await syncPendingGames()
    // Simula una respuesta perdida: el navegador cree que sigue pendiente
    useHistoryStore.setState({ records: [{ ...game, syncStatus: 'pending' }] })
    await syncPendingGames()
    expect(statuses()).toEqual(['synced'])
    expect(fakeApi.games.size).toBe(1)
  })

  it('las partidas rechazadas por el servidor quedan solo en el dispositivo', async () => {
    const player = registeredPlayer()
    useHistoryStore.setState({ records: [record(player.id, { xpEarned: 999 }), record(player.id)] })
    await syncPendingGames()
    expect(statuses()).toEqual(['rejected', 'synced'])
    expect(useHistoryStore.getState().records[0].syncError).toBe('La partida no es válida.')
  })

  it('registra con su mismo id los perfiles creados antes de la etapa 3', async () => {
    const legacy = usePlayerStore.getState().addProfile('Sol', 'dino')
    useHistoryStore.setState({ records: [record(legacy.id)] })
    await syncPendingGames()
    expect(fakeApi.players.get(legacy.id)?.username).toBe('Sol')
    expect(usePlayerStore.getState().profiles[0].registered).toBe(true)
    expect(statuses()).toEqual(['synced'])
  })

  it('si el nombre del perfil antiguo ya está tomado, conserva las partidas en local', async () => {
    fakeApi.players.set('otro', { id: 'otro', username: 'SOL', avatar: 'cat' })
    const legacy = usePlayerStore.getState().addProfile('Sol', 'dino')
    useHistoryStore.setState({ records: [record(legacy.id)] })
    await syncPendingGames()
    expect(usePlayerStore.getState().profiles[0].nameConflict).toBe(true)
    expect(statuses()).toEqual(['pending'])
  })

  it('envía en lotes de hasta 100 partidas', async () => {
    const player = registeredPlayer()
    useHistoryStore.setState({ records: Array.from({ length: 150 }, () => record(player.id)) })
    await syncPendingGames()
    const batches = fakeApi.requests.filter((r) => r.path === '/api/games/sync')
    expect(batches.map((b) => (b.body as { games: unknown[] }).games.length)).toEqual([100, 50])
    expect(statuses().every((s) => s === 'synced')).toBe(true)
  })

  it('el historial muestra el estado de sincronización y permite reintentar', async () => {
    const player = registeredPlayer()
    useHistoryStore.setState({ records: [record(player.id)] })
    fakeApi.offline = true
    const user = userEvent.setup()
    renderAt('/historial')
    expect(await screen.findByText(/Sin conexión: 1 partida pendiente/)).toBeInTheDocument()
    expect(screen.getByText('Pendiente')).toBeInTheDocument()

    fakeApi.offline = false
    await user.click(screen.getByRole('button', { name: 'Sincronizar ahora' }))
    await vi.waitFor(() => expect(screen.getByText('Sincronizado')).toBeInTheDocument())
    expect(screen.getByText('Todas tus partidas están guardadas en el servidor.')).toBeInTheDocument()
  })
})
