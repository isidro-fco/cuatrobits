/**
 * Archivo: PaginaJuego.test.tsx
 * Módulo: frontend / tests
 * Descripción: Pruebas de partidas completas de los cuatro minijuegos.
 * Requerimientos: RF21, RF53, RF63, RNF15
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router'

// ---------- Módulos internos ----------
import { CONTENIDO } from '../data/contenido'
import { generarNivelResoluble } from '../games/esferas/logicaEsferas'
import { crearMazo } from '../games/memorama/logicaMemorama'
import { rutasAplicacion } from '../rutas'
import { useHistorialStore } from '../stores/useHistorialStore'
import { useJugadorStore } from '../stores/useJugadorStore'
import { apiFalsa } from './apiFalsa'

// ---------- Pruebas ----------
beforeEach(() => {
  localStorage.clear()
  useJugadorStore.setState({ perfiles: [], idActivo: null })
  useHistorialStore.setState({ registros: [] })
  useJugadorStore.getState().agregarPerfil('Luna', 'cat')
})

afterEach(() => {
  vi.restoreAllMocks()
})

function renderizarEn(ruta: string) {
  const enrutador = createMemoryRouter(rutasAplicacion, { initialEntries: [ruta] })
  const vista = render(<RouterProvider router={enrutador} />)
  return { enrutador, ...vista }
}

const botonColumna = (numeroColumna: number) =>
  screen.getByRole('button', { name: new RegExp(`^Columna ${numeroColumna}`) })

describe('partida completa', () => {
  it('Conecta 4 entre dos jugadores: victoria, registro y resultados', async () => {
    const usuario = userEvent.setup()
    const { enrutador } = renderizarEn('/juego/connect-four?modo=local')
    await screen.findByText('Turno de Luna')

    // Luna llena la columna 1 y el Jugador 2 la columna 2
    for (let i = 0; i < 3; i++) {
      await usuario.click(botonColumna(1))
      await usuario.click(botonColumna(2))
    }
    await usuario.click(botonColumna(1))

    expect(await screen.findByRole('alert')).toHaveTextContent('¡Ganó Luna!')
    expect(botonColumna(3)).toBeDisabled()

    const [registro] = useHistorialStore.getState().registros
    expect(registro).toMatchObject({
      juego: 'connect-four',
      resultado: 'win',
      xpObtenida: 25,
      bitsObtenidos: 5,
    })
    expect(registro.detalles).toMatchObject({ modo: 'local', movimientos: 7, ganador: 'Luna' })
    expect(useJugadorStore.getState().perfiles[0]).toMatchObject({
      xp: 25,
      bits: 5,
      logros: ['first-game', 'first-win'],
    })
    // Se guarda primero en local y después se envía al servidor (sección 4.3)
    await vi.waitFor(() =>
      expect(useHistorialStore.getState().registros[0].estadoSincronizacion).toBe('synced'),
    )
    expect(apiFalsa.partidas.get(registro.id)).toMatchObject({
      juego: 'connect-four',
      resultado: 'win',
    })

    await usuario.click(screen.getByRole('button', { name: /Ver resultados/ }))
    expect(await screen.findByRole('heading', { name: '¡VICTORIA!' })).toBeInTheDocument()
    expect(screen.getByText('+25 XP')).toBeInTheDocument()
    expect(screen.getByText('+5 Bits')).toBeInTheDocument()
    expect(screen.getByText('¡Primera partida!')).toBeInTheDocument()
    expect(screen.getByText('¡Primera victoria!')).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: /Reiniciar partida/ }))
    expect(enrutador.state.location.search).toBe('?modo=local')
    expect(await screen.findByText('Turno de Luna')).toBeInTheDocument()
  })

  it('reiniciar desde la pausa no conserva el tablero anterior', async () => {
    const usuario = userEvent.setup()
    const { container: contenedor } = renderizarEn('/juego/connect-four?modo=local')
    await usuario.click(await screen.findByRole('button', { name: /^Columna 4/ }))
    expect(contenedor.querySelectorAll('.c4__board .c4__disc')).toHaveLength(1)

    await usuario.click(screen.getByRole('button', { name: /Pausa/ }))
    await usuario.click(screen.getByRole('button', { name: /Reiniciar partida/ }))
    expect(contenedor.querySelectorAll('.c4__board .c4__disc')).toHaveLength(0)
    expect(screen.getByText('Turno de Luna')).toBeInTheDocument()
  })

  it('Arma a BitBot: adivinar la palabra con el teclado en pantalla', async () => {
    const usuario = userEvent.setup()
    renderizarEn('/juego/bitbot?categoria=animals&dificultad=easy')
    const pista = (await screen.findByText('Pista:')).parentElement!.textContent!.replace(
      'Pista: ',
      '',
    )
    const { palabra } = CONTENIDO.animals.palabras.find((entrada) => entrada.pista === pista)!
    const teclado = screen.getByRole('group', { name: 'Teclado' })

    // Una letra incorrecta queda deshabilitada y consume un intento
    const incorrecto = [...'QWXZKJ'].find((letra) => !palabra.includes(letra))!
    await usuario.click(within(teclado).getByRole('button', { name: incorrecto }))
    expect(
      within(teclado).getByRole('button', { name: `${incorrecto}, incorrecta` }),
    ).toBeDisabled()
    expect(screen.getByLabelText('Te quedan 4 de 5 intentos')).toBeInTheDocument()

    const letras = new Set([...palabra.normalize('NFD').replace(/[́̈]/g, '')])
    for (const letra of letras) {
      await usuario.click(within(teclado).getByRole('button', { name: letra }))
    }

    expect(await screen.findByRole('alert')).toHaveTextContent('¡BitBot está completo!')
    expect(screen.getByRole('img', { name: 'BitBot con 8 de 8 piezas' })).toBeInTheDocument()
    expect(useHistorialStore.getState().registros[0]).toMatchObject({
      juego: 'bitbot',
      resultado: 'win',
      xpObtenida: 20,
    })
  })

  it('Ordenamiento de esferas: deshacer y completar el nivel', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.42)
    const { solucion } = generarNivelResoluble(3, () => 0.42)
    const usuario = userEvent.setup()
    renderizarEn('/juego/ball-sort?colores=3')
    const tubo = (i: number) => screen.getByRole('button', { name: new RegExp(`^Tubo ${i + 1}:`) })

    const [origen, destino] = solucion[0]
    await usuario.click(
      await screen.findByRole('button', { name: new RegExp(`^Tubo ${origen + 1}:`) }),
    )
    await usuario.click(tubo(destino))
    expect(screen.getByText('Movimientos: 1')).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: /Deshacer/ }))
    expect(screen.getByText('Movimientos: 0')).toBeInTheDocument()

    for (const [primero, segundo] of solucion) {
      await usuario.click(tubo(primero))
      await usuario.click(tubo(segundo))
    }
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '¡Todas las esferas están ordenadas!',
    )
    expect(useHistorialStore.getState().registros[0]).toMatchObject({
      juego: 'ball-sort',
      resultado: 'completed',
      xpObtenida: 25,
      detalles: { colores: 3, movimientos: solucion.length, estaCompletada: true },
    })
  })

  it(
    'Ordenamiento de esferas: «Nuevas esferas» cambia el nivel y reinicia los ' + 'movimientos',
    async () => {
      const aleatorio = vi.spyOn(Math, 'random').mockReturnValue(0.42)
      const primero = generarNivelResoluble(4, () => 0.42)
      const segundo = generarNivelResoluble(4, () => 0.77)
      const usuario = userEvent.setup()
      renderizarEn('/juego/ball-sort?colores=4')
      const etiquetas = () =>
        screen
          .getAllByRole('button', { name: /^Tubo \d+:/ })
          .map((boton) => boton.getAttribute('aria-label'))
      await screen.findByText('Movimientos: 0')
      const antes = etiquetas()

      const [origen, destino] = primero.solucion[0]
      await usuario.click(screen.getByRole('button', { name: new RegExp(`^Tubo ${origen + 1}:`) }))
      await usuario.click(screen.getByRole('button', { name: new RegExp(`^Tubo ${destino + 1}:`) }))
      expect(screen.getByText('Movimientos: 1')).toBeInTheDocument()

      aleatorio.mockReturnValue(0.77)
      await usuario.click(screen.getByRole('button', { name: /Nuevas esferas/ }))
      expect(screen.getByText('Movimientos: 0')).toBeInTheDocument()
      expect(etiquetas()).not.toEqual(antes)
      // El nuevo nivel también se puede terminar con su solución verificada
      for (const [primeroActual, segundoActual] of segundo.solucion) {
        await usuario.click(
          screen.getByRole('button', { name: new RegExp(`^Tubo ${primeroActual + 1}:`) }),
        )
        await usuario.click(
          screen.getByRole('button', { name: new RegExp(`^Tubo ${segundoActual + 1}:`) }),
        )
      }
      expect(await screen.findByRole('alert')).toHaveTextContent(
        '¡Todas las esferas están ordenadas!',
      )
    },
  )

  it('Memorama: encontrar todas las parejas', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.3)
    const mazo = crearMazo(CONTENIDO.fruits.imagenes, 4, () => 0.3)
    const usuario = userEvent.setup()
    renderizarEn('/juego/memory?categoria=fruits&dificultad=easy')
    await screen.findByText('Parejas: 0 / 4')
    const cartas = screen.getAllByRole('button', { name: /boca abajo/ })
    expect(cartas).toHaveLength(8)

    const vistos = new Set<number>()
    for (let i = 0; i < mazo.length; i++) {
      if (vistos.has(i)) {
        continue
      }
      const j = mazo.findIndex(
        (carta, otroIndice) => otroIndice !== i && carta.idPareja === mazo[i].idPareja,
      )
      vistos.add(j)
      await usuario.click(cartas[i])
      await usuario.click(cartas[j])
    }

    expect(await screen.findByRole('alert')).toHaveTextContent('¡Nuevo récord de intentos!')
    expect(screen.getByText('Parejas: 4 / 4')).toBeInTheDocument()
    expect(useHistorialStore.getState().registros[0]).toMatchObject({
      juego: 'memory',
      resultado: 'completed',
      detalles: { dificultad: 'easy', parejas: 4, intentos: 4 },
    })
  })
})
