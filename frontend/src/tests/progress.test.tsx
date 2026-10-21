import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { ACHIEVEMENTS } from '../data/achievements'
import { bitbotSprite, COSMETICS, DEFAULT_BITBOT, FREE_ITEMS } from '../data/cosmetics'
import { BITBOT_SPRITE } from '../data/sprites'
import { routes } from '../routes'
import { playSfx } from '../services/audio'
import { syncPendingGames } from '../services/syncService'
import { useHistoryStore } from '../stores/historyStore'
import { usePlayerStore } from '../stores/playerStore'
import { useSettingsStore } from '../stores/settingsStore'
import type { GameId, GameRecord } from '../types'
import { ACHIEVEMENT_RULES, evaluateAchievements, summarizeGames } from '../utils/achievements'
import { bitsForGame, xpForGame } from '../utils/rewards'
import { fakeApi } from './fakeApi'

beforeEach(() => {
  localStorage.clear()
  usePlayerStore.setState({ profiles: [], activeId: null })
  useHistoryStore.setState({ records: [] })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const player = () => usePlayerStore.getState().profiles[0]

function record(game: GameId, result: GameRecord['result'], details: Record<string, unknown> = {}): GameRecord {
  return {
    id: crypto.randomUUID(),
    playerId: player()?.id ?? 'p',
    game,
    result,
    durationMs: 1000,
    xpEarned: xpForGame(game, result),
    bitsEarned: bitsForGame(result),
    summary: '',
    details,
    playedAt: new Date().toISOString(),
    syncStatus: 'synced',
  }
}

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

describe('Bits por partida (sección 9.4)', () => {
  it('se ganan siempre y hay bono por ganar o completar', () => {
    expect(bitsForGame('loss')).toBe(2)
    expect(bitsForGame('draw')).toBe(2)
    expect(bitsForGame('win')).toBe(5)
    expect(bitsForGame('completed')).toBe(5)
  })
})

describe('logros (sección 9.3)', () => {
  it('cada logro del catálogo tiene una regla', () => {
    expect(ACHIEVEMENT_RULES.map((r) => r.id)).toEqual(ACHIEVEMENTS.map((a) => a.id))
  })

  it('primera partida y primera victoria', () => {
    expect(evaluateAchievements(summarizeGames([]))).toEqual([])
    expect(evaluateAchievements(summarizeGames([record('connect-four', 'loss')]))).toEqual(['first-game'])
    expect(evaluateAchievements(summarizeGames([record('bitbot', 'win')]))).toEqual(['first-game', 'first-win'])
  })

  it('una victoria en cada juego y cinco partidas', () => {
    const games = [
      record('connect-four', 'win'),
      record('bitbot', 'win'),
      record('ball-sort', 'completed'),
      record('memory', 'completed', { pairs: 4 }),
    ]
    expect(evaluateAchievements(summarizeGames(games))).toContain('win-each-game')
    expect(evaluateAchievements(summarizeGames(games))).not.toContain('five-games')
    expect(evaluateAchievements(summarizeGames([...games, record('bitbot', 'loss')]))).toContain('five-games')
  })

  it('las parejas de Memorama se suman entre partidas', () => {
    const two = [record('memory', 'completed', { pairs: 4 }), record('memory', 'completed', { pairs: 4 })]
    expect(evaluateAchievements(summarizeGames(two))).not.toContain('memory-10')
    expect(evaluateAchievements(summarizeGames([...two, record('memory', 'completed', { pairs: 4 })]))).toContain(
      'memory-10',
    )
  })

  it('las derrotas no cuentan como palabras adivinadas', () => {
    const games = [...Array(9)].map(() => record('bitbot', 'win'))
    expect(evaluateAchievements(summarizeGames([...games, record('bitbot', 'loss')]))).not.toContain('bitbot-10')
    expect(evaluateAchievements(summarizeGames([...games, record('bitbot', 'win')]))).toContain('bitbot-10')
  })

  it('no se otorgan dos veces', () => {
    usePlayerStore.getState().addProfile('Luna', 'cat')
    const { unlockAchievements } = usePlayerStore.getState()
    expect(unlockAchievements(player().id, ['first-game'])).toEqual(['first-game'])
    expect(unlockAchievements(player().id, ['first-game', 'first-win'])).toEqual(['first-win'])
    expect(player().achievements).toEqual(['first-game', 'first-win'])
  })

  it('los perfiles con partidas anteriores reciben sus logros al abrir la app', async () => {
    usePlayerStore.getState().addProfile('Luna', 'cat')
    useHistoryStore.setState({ records: [record('ball-sort', 'completed')] })
    renderAt('/')
    await vi.waitFor(() => expect(player().achievements).toEqual(['first-game', 'first-win']))
  })
})

describe('artículos de BitBot (sección 9.4)', () => {
  beforeEach(() => {
    usePlayerStore.getState().addProfile('Luna', 'cat', crypto.randomUUID())
  })

  it('un perfil nuevo tiene los artículos gratuitos y la apariencia clásica', () => {
    expect(player()).toMatchObject({ items: FREE_ITEMS, pendingItems: [], bitbot: DEFAULT_BITBOT })
    expect(bitbotSprite(DEFAULT_BITBOT)).toEqual(BITBOT_SPRITE)
  })

  it('los accesorios conservan el tamaño del sprite y el color cambia el cuerpo', () => {
    for (const item of COSMETICS) {
      const sprite = bitbotSprite({ ...DEFAULT_BITBOT, [item.kind]: item.id })
      expect(sprite.half).toHaveLength(BITBOT_SPRITE.half.length)
      for (const row of sprite.half) {
        expect(row).toHaveLength(6)
        for (const char of row) if (char !== '.') expect(sprite.palette[char], `${item.id}: ${char}`).toBeDefined()
      }
    }
    expect(bitbotSprite({ ...DEFAULT_BITBOT, color: 'color-mint' }).palette.b).toBe('#2bb59a')
  })

  it('no se puede comprar sin Bits suficientes ni dos veces', () => {
    const { buyItem, addRewards } = usePlayerStore.getState()
    expect(buyItem(player().id, 'color-mint')).toBe(false)
    addRewards(player().id, { xp: 0, bits: 35 })
    expect(buyItem(player().id, 'color-mint')).toBe(true)
    expect(buyItem(player().id, 'color-mint')).toBe(false)
    expect(player()).toMatchObject({ bits: 5, pendingItems: ['color-mint'] })
    expect(player().items).toContain('color-mint')
  })

  it('solo se pueden usar artículos comprados', () => {
    const { equipItem } = usePlayerStore.getState()
    equipItem(player().id, 'accessory-crown')
    expect(player().bitbot.accessory).toBe('accessory-none')
  })

  it('en el taller se compra un artículo y BitBot lo usa', async () => {
    usePlayerStore.getState().addRewards(player().id, { xp: 0, bits: 45 })
    const user = userEvent.setup()
    renderAt('/taller')
    expect(await screen.findByRole('button', { name: 'Comprar Corona por 100 Bits' })).toBeDisabled()
    expect(screen.getByText('Te faltan 55 Bits')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Comprar Gorro por 40 Bits' }))
    expect(screen.getByRole('status')).toHaveTextContent('¡Compraste Gorro!')
    expect(player()).toMatchObject({ bits: 5, bitbot: { accessory: 'accessory-cap' } })

    // Volver al accesorio anterior no cuesta nada
    await user.click(screen.getAllByRole('button', { name: 'Usar' })[0])
    expect(player().bitbot.accessory).not.toBe('accessory-cap')
  })

  it('las compras se envían al servidor después de las partidas', async () => {
    fakeApi.players.set(player().id, { id: player().id, username: 'Luna', avatar: 'cat' })
    const games = [...Array(8)].map(() => ({ ...record('ball-sort', 'completed'), syncStatus: 'pending' as const }))
    useHistoryStore.setState({ records: games })
    usePlayerStore.getState().addRewards(player().id, { xp: 0, bits: 40 })
    usePlayerStore.getState().buyItem(player().id, 'accessory-cap')

    await syncPendingGames()
    expect(fakeApi.items.get(player().id)).toEqual(new Set(['accessory-cap']))
    expect(player().pendingItems).toEqual([])
    const paths = fakeApi.requests.map((r) => r.path)
    expect(paths.indexOf('/api/games/sync')).toBeLessThan(paths.indexOf(`/api/players/${player().id}/items`))
  })

  it('si el servidor rechaza la compra, el artículo se conserva en el dispositivo', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    fakeApi.players.set(player().id, { id: player().id, username: 'Luna', avatar: 'cat' })
    usePlayerStore.getState().addRewards(player().id, { xp: 0, bits: 40 })
    usePlayerStore.getState().buyItem(player().id, 'accessory-cap')

    await syncPendingGames()
    expect(fakeApi.items.get(player().id)).toBeUndefined()
    expect(player()).toMatchObject({ pendingItems: [], items: expect.arrayContaining(['accessory-cap']) })
  })

  it('sin conexión la compra queda pendiente', async () => {
    fakeApi.offline = true
    usePlayerStore.getState().addRewards(player().id, { xp: 0, bits: 40 })
    usePlayerStore.getState().buyItem(player().id, 'accessory-cap')
    await syncPendingGames()
    expect(player().pendingItems).toEqual(['accessory-cap'])
  })

  it('los perfiles guardados antes de la etapa 4 se actualizan', async () => {
    const old = { id: 'viejo', username: 'Sol', avatar: 'dino', xp: 50, bits: 0, achievements: [], createdAt: '' }
    localStorage.setItem('cuatrobits-players', JSON.stringify({ state: { profiles: [old], activeId: 'viejo' }, version: 1 }))
    await usePlayerStore.persist.rehydrate()
    expect(usePlayerStore.getState().profiles[0]).toMatchObject({
      username: 'Sol',
      xp: 50,
      items: FREE_ITEMS,
      pendingItems: [],
      bitbot: DEFAULT_BITBOT,
    })
  })
})

describe('subida de nivel', () => {
  it('los resultados avisan al subir de nivel', async () => {
    usePlayerStore.getState().addProfile('Luna', 'cat')
    usePlayerStore.getState().addRewards(player().id, { xp: 90, bits: 0 })
    const user = userEvent.setup()
    renderAt('/juego/connect-four?modo=local')
    const column = (n: number) => screen.getByRole('button', { name: new RegExp(`^Columna ${n}`) })
    await screen.findByText('Turno de Luna')
    for (let i = 0; i < 3; i++) {
      await user.click(column(1))
      await user.click(column(2))
    }
    await user.click(column(1))
    await user.click(await screen.findByRole('button', { name: /Ver resultados/ }))
    expect(await screen.findByText('¡Nivel 2!')).toBeInTheDocument()
  })
})

describe('efectos de sonido (sección 12.2)', () => {
  function stubAudio() {
    const oscillators: unknown[] = []
    const param = { setValueAtTime() {}, linearRampToValueAtTime() {} }
    const node = () => ({ connect: (n: unknown) => n, gain: param })
    class FakeAudioContext {
      state = 'running'
      currentTime = 0
      destination = {}
      createGain = node
      createOscillator() {
        const osc = { ...node(), frequency: param, type: '', start() {}, stop() {} }
        oscillators.push(osc)
        return osc
      }
      resume = () => Promise.resolve()
    }
    vi.stubGlobal('AudioContext', FakeAudioContext)
    return oscillators
  }

  it('suenan solo si los efectos están activados', () => {
    const oscillators = stubAudio()
    useSettingsStore.setState({ sfx: false })
    playSfx('win')
    expect(oscillators).toHaveLength(0)
    useSettingsStore.setState({ sfx: true })
    playSfx('win')
    expect(oscillators.length).toBeGreaterThan(0)
  })
})
