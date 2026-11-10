/**
 * Archivo: recompensas.test.tsx
 * Módulo: frontend / tests
 * Descripción: Pruebas de experiencia, Bits, logros y artículos cosméticos.
 * Requerimientos: RF46, RF48, RF49
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router'

// ---------- Módulos internos ----------
import { LOGROS } from '../data/logros'
import { AVATARES } from '../data/avatares'
import {
  spriteAvatar,
  spriteBitBot,
  COSMETICOS,
  BITBOT_PREDETERMINADO,
  ARTICULOS_GRATIS,
} from '../data/cosmeticos'
import { SPRITES_AVATAR, SPRITE_BITBOT } from '../data/sprites'
import { rutasAplicacion } from '../rutas'
import { reproducirEfecto } from '../services/audio'
import { sincronizarPartidasPendientes } from '../services/servicioSincronizacion'
import { useHistorialStore } from '../stores/useHistorialStore'
import { useJugadorStore } from '../stores/useJugadorStore'
import { useAjustesStore } from '../stores/useAjustesStore'
import type { IdJuego, Partida } from '../types'
import { REGLAS_LOGROS, evaluarLogros, resumirPartidas } from '../utils/reglasLogros'
import { bitsPorPartida, xpPorPartida } from '../utils/recompensas'
import { apiFalsa } from './apiFalsa'

// ---------- Pruebas ----------
beforeEach(() => {
  localStorage.clear()
  useJugadorStore.setState({ perfiles: [], idActivo: null })
  useHistorialStore.setState({ registros: [] })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const jugador = () => useJugadorStore.getState().perfiles[0]

function registro(
  juego: IdJuego,
  resultado: Partida['resultado'],
  detalles: Record<string, unknown> = {},
): Partida {
  return {
    id: crypto.randomUUID(),
    jugadorId: jugador()?.id ?? 'p',
    juego,
    resultado,
    duracionMs: 1000,
    xpObtenida: xpPorPartida(juego, resultado),
    bitsObtenidos: bitsPorPartida(resultado),
    resumen: '',
    detalles,
    jugadaEn: new Date().toISOString(),
    estadoSincronizacion: 'synced',
  }
}

function renderizarEn(ruta: string) {
  const enrutador = createMemoryRouter(rutasAplicacion, { initialEntries: [ruta] })
  render(<RouterProvider router={enrutador} />)
  return enrutador
}

describe('Bits por partida (sección 9.4)', () => {
  it('se ganan siempre y hay bono por ganar o completar', () => {
    expect(bitsPorPartida('loss')).toBe(2)
    expect(bitsPorPartida('draw')).toBe(2)
    expect(bitsPorPartida('win')).toBe(5)
    expect(bitsPorPartida('completed')).toBe(5)
  })
})

describe('logros (sección 9.3)', () => {
  it('cada logro del catálogo tiene una regla', () => {
    expect(REGLAS_LOGROS.map((regla) => regla.id)).toEqual(LOGROS.map((logro) => logro.id))
  })

  it('primera partida y primera victoria', () => {
    expect(evaluarLogros(resumirPartidas([]))).toEqual([])
    expect(evaluarLogros(resumirPartidas([registro('connect-four', 'loss')]))).toEqual([
      'first-game',
    ])
    expect(evaluarLogros(resumirPartidas([registro('bitbot', 'win')]))).toEqual([
      'first-game',
      'first-win',
    ])
  })

  it('una victoria en cada juego y cinco partidas', () => {
    const partidas = [
      registro('connect-four', 'win'),
      registro('bitbot', 'win'),
      registro('ball-sort', 'completed'),
      registro('memory', 'completed', { parejas: 4 }),
    ]
    expect(evaluarLogros(resumirPartidas(partidas))).toContain('win-each-game')
    expect(evaluarLogros(resumirPartidas(partidas))).not.toContain('five-games')
    expect(evaluarLogros(resumirPartidas([...partidas, registro('bitbot', 'loss')]))).toContain(
      'five-games',
    )
  })

  it('las parejas de Memorama se suman entre partidas', () => {
    const dos = [
      registro('memory', 'completed', { parejas: 4 }),
      registro('memory', 'completed', { parejas: 4 }),
    ]
    expect(evaluarLogros(resumirPartidas(dos))).not.toContain('memory-10')
    expect(
      evaluarLogros(resumirPartidas([...dos, registro('memory', 'completed', { parejas: 4 })])),
    ).toContain('memory-10')
  })

  it('las derrotas no cuentan como palabras adivinadas', () => {
    const partidas = [...Array(9)].map(() => registro('bitbot', 'win'))
    expect(evaluarLogros(resumirPartidas([...partidas, registro('bitbot', 'loss')]))).not.toContain(
      'bitbot-10',
    )
    expect(evaluarLogros(resumirPartidas([...partidas, registro('bitbot', 'win')]))).toContain(
      'bitbot-10',
    )
  })

  it('no se otorgan dos veces', () => {
    useJugadorStore.getState().agregarPerfil('Luna', 'cat')
    const { desbloquearLogros } = useJugadorStore.getState()
    expect(desbloquearLogros(jugador().id, ['first-game'])).toEqual(['first-game'])
    expect(desbloquearLogros(jugador().id, ['first-game', 'first-win'])).toEqual(['first-win'])
    expect(jugador().logros).toEqual(['first-game', 'first-win'])
  })

  it('los perfiles con partidas anteriores reciben sus logros al abrir la app', async () => {
    useJugadorStore.getState().agregarPerfil('Luna', 'cat')
    useHistorialStore.setState({ registros: [registro('ball-sort', 'completed')] })
    renderizarEn('/')
    await vi.waitFor(() => expect(jugador().logros).toEqual(['first-game', 'first-win']))
  })
})

describe('artículos de BitBot (sección 9.4)', () => {
  beforeEach(() => {
    useJugadorStore.getState().agregarPerfil('Luna', 'cat', crypto.randomUUID())
  })

  it('un perfil nuevo tiene los artículos gratuitos y la apariencia clásica', () => {
    expect(jugador()).toMatchObject({
      articulos: ARTICULOS_GRATIS,
      articulosPendientes: [],
      bitbot: BITBOT_PREDETERMINADO,
    })
    expect(spriteBitBot(BITBOT_PREDETERMINADO)).toEqual(SPRITE_BITBOT)
  })

  it('los accesorios conservan el tamaño del sprite y el color cambia el cuerpo', () => {
    for (const articulo of COSMETICOS) {
      const sprite = spriteBitBot({ ...BITBOT_PREDETERMINADO, [articulo.tipo]: articulo.id })
      expect(sprite.mitad).toHaveLength(SPRITE_BITBOT.mitad.length)
      for (const fila of sprite.mitad) {
        expect(fila).toHaveLength(6)
        for (const caracter of fila) {
          if (caracter !== '.') {
            expect(sprite.paleta[caracter], `${articulo.id}: ${caracter}`).toBeDefined()
          }
        }
      }
    }
    expect(spriteBitBot({ ...BITBOT_PREDETERMINADO, color: 'color-mint' }).paleta.b).toBe('#2bb59a')
  })

  it('el avatar del jugador lleva los mismos artículos que BitBot', () => {
    for (const { id } of AVATARES) {
      const base = SPRITES_AVATAR[id]
      expect(spriteAvatar(id, BITBOT_PREDETERMINADO)).toEqual(base)
      for (const articulo of COSMETICOS.filter(
        (articulo) => articulo.tipo === 'accesorio' && articulo.superposicion,
      )) {
        const sprite = spriteAvatar(id, { ...BITBOT_PREDETERMINADO, accesorio: articulo.id })
        expect(sprite.mitad, `${id} + ${articulo.id}`).not.toEqual(base.mitad)
        expect(sprite.mitad).toHaveLength(base.mitad.length)
        for (const fila of sprite.mitad) {
          for (const caracter of fila) {
            if (caracter !== '.') {
              expect(sprite.paleta[caracter]).toBeDefined()
            }
          }
        }
        // Los colores del accesorio no cambian los del avatar
        for (const [key, color] of Object.entries(base.paleta)) {
          expect(sprite.paleta[key], `${id} + ${articulo.id}: ${key}`).toBe(color)
        }
      }
    }
    expect(
      spriteAvatar('dino', { color: 'color-orange', accesorio: 'accessory-crown' }).paleta.g,
    ).toBe('#ff8c42')
  })

  it('no se puede comprar sin Bits suficientes ni dos veces', () => {
    const { comprarArticulo, agregarRecompensas } = useJugadorStore.getState()
    expect(comprarArticulo(jugador().id, 'color-mint')).toBe(false)
    agregarRecompensas(jugador().id, { xp: 0, bits: 35 })
    expect(comprarArticulo(jugador().id, 'color-mint')).toBe(true)
    expect(comprarArticulo(jugador().id, 'color-mint')).toBe(false)
    expect(jugador()).toMatchObject({ bits: 5, articulosPendientes: ['color-mint'] })
    expect(jugador().articulos).toContain('color-mint')
  })

  it('solo se pueden usar artículos comprados', () => {
    const { equiparArticulo } = useJugadorStore.getState()
    equiparArticulo(jugador().id, 'accessory-crown')
    expect(jugador().bitbot.accesorio).toBe('accessory-none')
  })

  it('en el taller se compra un artículo y el avatar del jugador lo usa', async () => {
    useJugadorStore.getState().agregarRecompensas(jugador().id, { xp: 0, bits: 45 })
    const usuario = userEvent.setup()
    renderizarEn('/taller')
    expect(
      await screen.findByRole('button', { name: 'Comprar Corona por 100 Bits' }),
    ).toBeDisabled()
    expect(screen.getByText('Te faltan 55 Bits')).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Comprar Gorro por 40 Bits' }))
    expect(screen.getByRole('status')).toHaveTextContent('¡Compraste Gorro!')
    expect(jugador()).toMatchObject({ bits: 5, bitbot: { accesorio: 'accessory-cap' } })
    // La vista grande es el avatar del jugador con el gorro rojo puesto
    expect(
      screen.getByRole('img', { name: 'Gato naranja' }).querySelector('rect[fill="#e5484d"]'),
    ).not.toBeNull()

    // Volver al accesorio anterior no cuesta nada
    await usuario.click(screen.getAllByRole('button', { name: 'Usar' })[0])
    expect(jugador().bitbot.accesorio).not.toBe('accessory-cap')
  })

  it('las compras se envían al servidor después de las partidas', async () => {
    apiFalsa.jugadores.set(jugador().id, { id: jugador().id, username: 'Luna', avatar: 'cat' })
    const partidas = [...Array(8)].map(() => ({
      ...registro('ball-sort', 'completed'),
      estadoSincronizacion: 'pending' as const,
    }))
    useHistorialStore.setState({ registros: partidas })
    useJugadorStore.getState().agregarRecompensas(jugador().id, { xp: 0, bits: 40 })
    useJugadorStore.getState().comprarArticulo(jugador().id, 'accessory-cap')

    await sincronizarPartidasPendientes()
    expect(apiFalsa.articulos.get(jugador().id)).toEqual(new Set(['accessory-cap']))
    expect(jugador().articulosPendientes).toEqual([])
    const rutas = apiFalsa.solicitudes.map((solicitud) => solicitud.ruta)
    expect(rutas.indexOf('/api/games/sync')).toBeLessThan(
      rutas.indexOf(`/api/players/${jugador().id}/items`),
    )
  })

  it('si el servidor rechaza la compra, el artículo se conserva en el dispositivo', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    apiFalsa.jugadores.set(jugador().id, { id: jugador().id, username: 'Luna', avatar: 'cat' })
    useJugadorStore.getState().agregarRecompensas(jugador().id, { xp: 0, bits: 40 })
    useJugadorStore.getState().comprarArticulo(jugador().id, 'accessory-cap')

    await sincronizarPartidasPendientes()
    expect(apiFalsa.articulos.get(jugador().id)).toBeUndefined()
    expect(jugador()).toMatchObject({
      articulosPendientes: [],
      articulos: expect.arrayContaining(['accessory-cap']),
    })
  })

  it('sin conexión la compra queda pendiente', async () => {
    apiFalsa.estaSinConexion = true
    useJugadorStore.getState().agregarRecompensas(jugador().id, { xp: 0, bits: 40 })
    useJugadorStore.getState().comprarArticulo(jugador().id, 'accessory-cap')
    await sincronizarPartidasPendientes()
    expect(jugador().articulosPendientes).toEqual(['accessory-cap'])
  })

  it('los perfiles guardados antes de la etapa 4 se actualizan', async () => {
    // Perfil con las claves en inglés que usaba la versión 1
    const anterior = {
      id: 'viejo',
      username: 'Sol',
      avatar: 'dino',
      xp: 50,
      bits: 0,
      achievements: [],
      createdAt: '',
    }
    localStorage.setItem(
      'cuatrobits-players',
      JSON.stringify({ state: { profiles: [anterior], activeId: 'viejo' }, version: 1 }),
    )
    await useJugadorStore.persist.rehydrate()
    expect(useJugadorStore.getState().perfiles[0]).toMatchObject({
      username: 'Sol',
      xp: 50,
      articulos: ARTICULOS_GRATIS,
      articulosPendientes: [],
      bitbot: BITBOT_PREDETERMINADO,
    })
  })
})

describe('subida de nivel', () => {
  it('los resultados avisan al subir de nivel', async () => {
    useJugadorStore.getState().agregarPerfil('Luna', 'cat')
    useJugadorStore.getState().agregarRecompensas(jugador().id, { xp: 90, bits: 0 })
    const usuario = userEvent.setup()
    renderizarEn('/juego/connect-four?modo=local')
    const botonColumna = (numeroColumna: number) =>
      screen.getByRole('button', { name: new RegExp(`^Columna ${numeroColumna}`) })
    await screen.findByText('Turno de Luna')
    for (let i = 0; i < 3; i++) {
      await usuario.click(botonColumna(1))
      await usuario.click(botonColumna(2))
    }
    await usuario.click(botonColumna(1))
    await usuario.click(await screen.findByRole('button', { name: /Ver resultados/ }))
    expect(await screen.findByText('¡Nivel 2!')).toBeInTheDocument()
  })
})

describe('efectos de sonido (sección 12.2)', () => {
  function simularAudio() {
    const osciladores: unknown[] = []
    const parametro = { setValueAtTime() {}, linearRampToValueAtTime() {} }
    // Imita la API Web Audio del navegador, por eso sus miembros conservan los nombres en inglés
    const nodo = () => ({ connect: (destino: unknown) => destino, gain: parametro })
    class ContextoAudioFalso {
      state = 'running'
      currentTime = 0
      destination = {}
      createGain = nodo
      createOscillator() {
        const oscilador = { ...nodo(), frequency: parametro, type: '', start() {}, stop() {} }
        osciladores.push(oscilador)
        return oscilador
      }
      resume = () => Promise.resolve()
    }
    vi.stubGlobal('AudioContext', ContextoAudioFalso)
    return osciladores
  }

  it('suenan solo si los efectos están activados', () => {
    const osciladores = simularAudio()
    useAjustesStore.setState({ estaSonidoActivo: false })
    reproducirEfecto('win')
    expect(osciladores).toHaveLength(0)
    useAjustesStore.setState({ estaSonidoActivo: true })
    reproducirEfecto('win')
    expect(osciladores.length).toBeGreaterThan(0)
  })
})
