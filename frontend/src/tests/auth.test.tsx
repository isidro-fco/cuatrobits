import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '../routes'
import { syncPendingGames } from '../services/syncService'
import { useHistoryStore } from '../stores/historyStore'
import { usePlayerStore } from '../stores/playerStore'
import type { GameRecord } from '../types'
import { generateToken } from '../utils/token'
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
const statuses = () => useHistoryStore.getState().records.map((r) => r.syncStatus)

function pendingGame(playerId: string): GameRecord {
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
    playedAt: new Date().toISOString(),
    syncStatus: 'pending',
  }
}

describe('token del dispositivo (sección 4.3)', () => {
  it('es aleatorio y tiene 43 caracteres en base64url', () => {
    const token = generateToken()
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(generateToken()).not.toBe(token)
  })

  it('se crea al registrarse y acompaña cada envío de partidas', async () => {
    const user = userEvent.setup()
    renderAt('/registro')
    await user.type(await screen.findByLabelText('¿Cómo te llamas?'), 'Sol')
    await user.click(screen.getByRole('button', { name: /Crear perfil y jugar/ }))
    await vi.waitFor(() => expect(player()?.authToken).toMatch(/^[A-Za-z0-9_-]{43}$/))

    const token = player().authToken
    expect(fakeApi.requests.find((r) => r.path === '/api/players')?.body).toMatchObject({ token })
    useHistoryStore.getState().addRecord(pendingGame(player().id))
    await syncPendingGames()
    expect(fakeApi.requests.find((r) => r.path === '/api/games/sync')?.token).toBe(token)
    expect(statuses()).toEqual(['synced'])
  })

  it('los perfiles registrados antes de la autenticación obtienen su token al sincronizar', async () => {
    const id = crypto.randomUUID()
    fakeApi.players.set(id, { id, username: 'Mar', avatar: 'dino' })
    usePlayerStore.getState().addProfile('Mar', 'dino', id)
    useHistoryStore.getState().addRecord(pendingGame(id))
    await syncPendingGames()
    expect(player().authToken).toBeDefined()
    expect(fakeApi.tokens.get(id)).toEqual(new Set([player().authToken]))
    expect(statuses()).toEqual(['synced'])
  })

  it('si otro dispositivo ya protegió el perfil, pide recuperarlo y conserva las partidas', async () => {
    const id = crypto.randomUUID()
    fakeApi.players.set(id, { id, username: 'Mar', avatar: 'dino' })
    fakeApi.tokens.set(id, new Set([generateToken()]))
    fakeApi.codes.set(id, 'K7QM-4TZP')
    usePlayerStore.getState().addProfile('Mar', 'dino', id)
    useHistoryStore.getState().addRecord(pendingGame(id))
    await syncPendingGames()
    expect(player().needsRecovery).toBe(true)
    expect(statuses()).toEqual(['pending'])

    renderAt('/historial')
    expect(await screen.findByText(/protegido en otro dispositivo/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sincronizar ahora' })).not.toBeInTheDocument()

    // Al recuperarlo con el código, este dispositivo queda autorizado y envía lo pendiente
    const user = userEvent.setup()
    renderAt('/recuperar')
    await user.type(await screen.findByLabelText('Tu nombre de jugador'), 'Mar')
    await user.type(screen.getByLabelText('Tu código secreto'), 'K7QM-4TZP')
    await user.click(screen.getByRole('button', { name: /Recuperar mi perfil/ }))
    await vi.waitFor(() => expect(player().needsRecovery).toBe(false))
    expect(fakeApi.tokens.get(id)?.has(player().authToken!)).toBe(true)
    await syncPendingGames()
    expect(statuses()).toEqual(['synced'])
  })

  it('si el servidor olvidó el token, el perfil se registra de nuevo una sola vez', async () => {
    const id = crypto.randomUUID()
    const token = generateToken()
    usePlayerStore.getState().addProfile('Rio', 'cat', id, token)
    useHistoryStore.getState().addRecord(pendingGame(id))
    // El servidor no conoce ni al jugador ni al token, como si su base de datos se hubiera reiniciado
    await syncPendingGames()
    expect(fakeApi.players.get(id)?.username).toBe('Rio')
    expect(fakeApi.tokens.get(id)).toEqual(new Set([token]))
    expect(statuses()).toEqual(['synced'])
    expect(fakeApi.requests.filter((r) => r.path === '/api/players')).toHaveLength(1)
  })

  it('las compras sin permiso no se descartan', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const id = crypto.randomUUID()
    const token = generateToken()
    fakeApi.players.set(id, { id, username: 'Rio', avatar: 'cat' })
    fakeApi.tokens.set(id, new Set([token]))
    usePlayerStore.getState().addProfile('Rio', 'cat', id, token)
    usePlayerStore.getState().addRewards(id, { xp: 0, bits: 40 })
    usePlayerStore.getState().buyItem(id, 'accessory-cap')
    // Otro dispositivo protegió el perfil y el servidor ya no acepta este token
    fakeApi.tokens.set(id, new Set([generateToken()]))
    await syncPendingGames()
    expect(player()).toMatchObject({ pendingItems: ['accessory-cap'], needsRecovery: true })
    vi.restoreAllMocks()
  })
})
