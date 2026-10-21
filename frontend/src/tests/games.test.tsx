import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { CONTENT } from '../data/content'
import { generateLevelWithSolution } from '../games/ball-sort/logic'
import { createDeck } from '../games/memory/logic'
import { routes } from '../routes'
import { useHistoryStore } from '../stores/historyStore'
import { usePlayerStore } from '../stores/playerStore'
import { fakeApi } from './fakeApi'

beforeEach(() => {
  localStorage.clear()
  usePlayerStore.setState({ profiles: [], activeId: null })
  useHistoryStore.setState({ records: [] })
  usePlayerStore.getState().addProfile('Luna', 'cat')
})

afterEach(() => {
  vi.restoreAllMocks()
})

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const view = render(<RouterProvider router={router} />)
  return { router, ...view }
}

const column = (n: number) => screen.getByRole('button', { name: new RegExp(`^Columna ${n}`) })

describe('partida completa', () => {
  it('Conecta 4 entre dos jugadores: victoria, registro y resultados', async () => {
    const user = userEvent.setup()
    const { router } = renderAt('/juego/connect-four?modo=local')
    await screen.findByText('Turno de Luna')

    // Luna llena la columna 1 y el Jugador 2 la columna 2
    for (let i = 0; i < 3; i++) {
      await user.click(column(1))
      await user.click(column(2))
    }
    await user.click(column(1))

    expect(await screen.findByRole('alert')).toHaveTextContent('¡Ganó Luna!')
    expect(column(3)).toBeDisabled()

    const [record] = useHistoryStore.getState().records
    expect(record).toMatchObject({ game: 'connect-four', result: 'win', xpEarned: 25, bitsEarned: 5 })
    expect(record.details).toMatchObject({ mode: 'local', moves: 7, winner: 'Luna' })
    expect(usePlayerStore.getState().profiles[0]).toMatchObject({
      xp: 25,
      bits: 5,
      achievements: ['first-game', 'first-win'],
    })
    // Se guarda primero en local y después se envía al servidor (sección 4.3)
    await vi.waitFor(() => expect(useHistoryStore.getState().records[0].syncStatus).toBe('synced'))
    expect(fakeApi.games.get(record.id)).toMatchObject({ game: 'connect-four', result: 'win' })

    await user.click(screen.getByRole('button', { name: /Ver resultados/ }))
    expect(await screen.findByRole('heading', { name: '¡VICTORIA!' })).toBeInTheDocument()
    expect(screen.getByText('+25 XP')).toBeInTheDocument()
    expect(screen.getByText('+5 Bits')).toBeInTheDocument()
    expect(screen.getByText('¡Primera partida!')).toBeInTheDocument()
    expect(screen.getByText('¡Primera victoria!')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Reiniciar partida/ }))
    expect(router.state.location.search).toBe('?modo=local')
    expect(await screen.findByText('Turno de Luna')).toBeInTheDocument()
  })

  it('reiniciar desde la pausa no conserva el tablero anterior', async () => {
    const user = userEvent.setup()
    const { container } = renderAt('/juego/connect-four?modo=local')
    await user.click(await screen.findByRole('button', { name: /^Columna 4/ }))
    expect(container.querySelectorAll('.c4__board .c4__disc')).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: /Pausa/ }))
    await user.click(screen.getByRole('button', { name: /Reiniciar partida/ }))
    expect(container.querySelectorAll('.c4__board .c4__disc')).toHaveLength(0)
    expect(screen.getByText('Turno de Luna')).toBeInTheDocument()
  })

  it('Arma a BitBot: adivinar la palabra con el teclado en pantalla', async () => {
    const user = userEvent.setup()
    renderAt('/juego/bitbot?categoria=animals&dificultad=easy')
    const hint = (await screen.findByText('Pista:')).parentElement!.textContent!.replace('Pista: ', '')
    const { word } = CONTENT.animals.words.find((w) => w.hint === hint)!
    const keyboard = screen.getByRole('group', { name: 'Teclado' })

    // Una letra incorrecta queda deshabilitada y consume un intento
    const wrong = [...'QWXZKJ'].find((l) => !word.includes(l))!
    await user.click(within(keyboard).getByRole('button', { name: wrong }))
    expect(within(keyboard).getByRole('button', { name: `${wrong}, incorrecta` })).toBeDisabled()
    expect(screen.getByLabelText('Te quedan 4 de 5 intentos')).toBeInTheDocument()

    const letters = new Set([...word.normalize('NFD').replace(/[́̈]/g, '')])
    for (const letter of letters) await user.click(within(keyboard).getByRole('button', { name: letter }))

    expect(await screen.findByRole('alert')).toHaveTextContent('¡BitBot está completo!')
    expect(screen.getByRole('img', { name: 'BitBot con 8 de 8 piezas' })).toBeInTheDocument()
    expect(useHistoryStore.getState().records[0]).toMatchObject({ game: 'bitbot', result: 'win', xpEarned: 20 })
  })

  it('Ordenamiento de esferas: deshacer y completar el nivel', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.42)
    const { solution } = generateLevelWithSolution(3, () => 0.42)
    const user = userEvent.setup()
    renderAt('/juego/ball-sort?colores=3')
    const tube = (i: number) => screen.getByRole('button', { name: new RegExp(`^Tubo ${i + 1}:`) })

    const [from, to] = solution[0]
    await user.click(await screen.findByRole('button', { name: new RegExp(`^Tubo ${from + 1}:`) }))
    await user.click(tube(to))
    expect(screen.getByText('Movimientos: 1')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Deshacer/ }))
    expect(screen.getByText('Movimientos: 0')).toBeInTheDocument()

    for (const [a, b] of solution) {
      await user.click(tube(a))
      await user.click(tube(b))
    }
    expect(await screen.findByRole('alert')).toHaveTextContent('¡Todas las esferas están ordenadas!')
    expect(useHistoryStore.getState().records[0]).toMatchObject({
      game: 'ball-sort',
      result: 'completed',
      xpEarned: 25,
      details: { colors: 3, moves: solution.length, completed: true },
    })
  })

  it('Ordenamiento de esferas: «Nuevas esferas» cambia el nivel y reinicia los movimientos', async () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.42)
    const first = generateLevelWithSolution(4, () => 0.42)
    const second = generateLevelWithSolution(4, () => 0.77)
    const user = userEvent.setup()
    renderAt('/juego/ball-sort?colores=4')
    const labels = () => screen.getAllByRole('button', { name: /^Tubo \d+:/ }).map((b) => b.getAttribute('aria-label'))
    await screen.findByText('Movimientos: 0')
    const before = labels()

    const [from, to] = first.solution[0]
    await user.click(screen.getByRole('button', { name: new RegExp(`^Tubo ${from + 1}:`) }))
    await user.click(screen.getByRole('button', { name: new RegExp(`^Tubo ${to + 1}:`) }))
    expect(screen.getByText('Movimientos: 1')).toBeInTheDocument()

    random.mockReturnValue(0.77)
    await user.click(screen.getByRole('button', { name: /Nuevas esferas/ }))
    expect(screen.getByText('Movimientos: 0')).toBeInTheDocument()
    expect(labels()).not.toEqual(before)
    // El nuevo nivel también se puede terminar con su solución verificada
    for (const [a, b] of second.solution) {
      await user.click(screen.getByRole('button', { name: new RegExp(`^Tubo ${a + 1}:`) }))
      await user.click(screen.getByRole('button', { name: new RegExp(`^Tubo ${b + 1}:`) }))
    }
    expect(await screen.findByRole('alert')).toHaveTextContent('¡Todas las esferas están ordenadas!')
  })

  it('Memorama: encontrar todas las parejas', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.3)
    const deck = createDeck(CONTENT.fruits.images, 4, () => 0.3)
    const user = userEvent.setup()
    renderAt('/juego/memory?categoria=fruits&dificultad=easy')
    await screen.findByText('Parejas: 0 / 4')
    const cards = screen.getAllByRole('button', { name: /boca abajo/ })
    expect(cards).toHaveLength(8)

    const seen = new Set<number>()
    for (let i = 0; i < deck.length; i++) {
      if (seen.has(i)) continue
      const j = deck.findIndex((c, k) => k !== i && c.pairId === deck[i].pairId)
      seen.add(j)
      await user.click(cards[i])
      await user.click(cards[j])
    }

    expect(await screen.findByRole('alert')).toHaveTextContent('¡Nuevo récord de intentos!')
    expect(screen.getByText('Parejas: 4 / 4')).toBeInTheDocument()
    expect(useHistoryStore.getState().records[0]).toMatchObject({
      game: 'memory',
      result: 'completed',
      details: { difficulty: 'easy', pairs: 4, attempts: 4 },
    })
  })
})
