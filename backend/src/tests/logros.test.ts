/**
 * Archivo: logros.test.ts
 * Módulo: backend / tests
 * Descripción: Pruebas de Bits por partida y desbloqueo de logros en el servidor.
 * Requerimientos: RF48, RF49
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

// ---------- Módulos internos ----------
import {
  partidaEsferas,
  partidaBitBot,
  partidaConecta4,
  encabezadoAutorizacion,
  crearAplicacionPrueba,
  partidaMemorama,
  tokenDe,
} from './ayudantesPrueba.js'

// ---------- Pruebas ----------
let contextoPrueba: Awaited<ReturnType<typeof crearAplicacionPrueba>>
let jugadorId: string

beforeAll(async () => {
  contextoPrueba = await crearAplicacionPrueba()
})
beforeEach(async () => {
  await contextoPrueba.restablecer()
  const respuestaPrueba = await contextoPrueba.aplicacion.inject({
    method: 'POST',
    url: '/api/players',
    payload: { username: 'Luna', avatar: 'cat', token: tokenDe('Luna') },
  })
  jugadorId = respuestaPrueba.json().id
})
afterAll(() => contextoPrueba.cerrar())

const enviarPartida = (payload: object) =>
  contextoPrueba.aplicacion.inject({
    headers: encabezadoAutorizacion('Luna'),
    method: 'POST',
    url: '/api/games',
    payload,
  })
const perfil = async () =>
  (
    await contextoPrueba.aplicacion.inject({
      headers: encabezadoAutorizacion('Luna'),
      method: 'GET',
      url: `/api/players/${jugadorId}`,
    })
  ).json()
const desbloqueados = async () => (await perfil()).logros.map((logro: { id: string }) => logro.id)
const comprar = (idArticulo: string) =>
  contextoPrueba.aplicacion.inject({
    headers: encabezadoAutorizacion('Luna'),
    method: 'POST',
    url: `/api/players/${jugadorId}/items`,
    payload: { idArticulo },
  })

describe('Bits por partida (sección 9.4)', () => {
  it('suma los Bits de cada partida y no los repite al reintentar', async () => {
    const juego = partidaConecta4(jugadorId, { bitsObtenidos: 5 })
    await enviarPartida(juego)
    await enviarPartida(juego)
    await enviarPartida(
      partidaConecta4(jugadorId, {
        resultado: 'loss',
        xpObtenida: 10,
        bitsObtenidos: 2,
        detalles: {
          jugadores: ['Luna', 'BitBot'],
          modo: 'ai',
          dificultad: 'normal',
          movimientos: 12,
          ganador: 'BitBot',
        },
      }),
    )
    expect((await perfil()).progreso.bits).toBe(7)
  })

  it('rechaza Bits que no corresponden al resultado', async () => {
    const respuestaPrueba = await enviarPartida(partidaMemorama(jugadorId, { bitsObtenidos: 999 }))
    expect(respuestaPrueba.statusCode).toBe(400)
    expect((await perfil()).progreso.bits).toBe(0)
  })

  it('acepta partidas anteriores a la etapa 4 sin Bits', async () => {
    const respuestaPrueba = await enviarPartida(partidaMemorama(jugadorId))
    expect(respuestaPrueba.statusCode).toBe(201)
    expect((await perfil()).progreso.bits).toBe(0)
  })

  it('el historial incluye los Bits de cada partida', async () => {
    await enviarPartida(partidaEsferas(jugadorId, { bitsObtenidos: 5 }))
    const historial = (
      await contextoPrueba.aplicacion.inject({
        headers: encabezadoAutorizacion('Luna'),
        method: 'GET',
        url: `/api/players/${jugadorId}/history`,
      })
    ).json()
    expect(historial.partidas[0].bitsObtenidos).toBe(5)
  })
})

describe('logros (sección 9.3)', () => {
  it(
    'la primera partida y la primera victoria se desbloquean al registrar la ' + 'partida',
    async () => {
      await enviarPartida(
        partidaConecta4(jugadorId, {
          resultado: 'loss',
          xpObtenida: 10,
          detalles: {
            jugadores: ['Luna', 'BitBot'],
            modo: 'ai',
            dificultad: 'easy',
            movimientos: 10,
            ganador: 'BitBot',
          },
        }),
      )
      expect(await desbloqueados()).toEqual(['first-game'])
      await enviarPartida(partidaBitBot(jugadorId))
      expect(await desbloqueados()).toEqual(['first-game', 'first-win'])
    },
  )

  it('cinco partidas y una victoria en cada juego', async () => {
    for (const crearPartida of [
      partidaConecta4,
      partidaBitBot,
      partidaEsferas,
      partidaMemorama,
      partidaMemorama,
    ]) {
      await enviarPartida(crearPartida(jugadorId))
    }
    expect(await desbloqueados()).toEqual(expect.arrayContaining(['five-games', 'win-each-game']))
  })

  it('diez parejas de Memorama se cuentan entre partidas', async () => {
    await enviarPartida(partidaMemorama(jugadorId))
    await enviarPartida(partidaMemorama(jugadorId))
    expect(await desbloqueados()).not.toContain('memory-10')
    await enviarPartida(partidaMemorama(jugadorId))
    expect(await desbloqueados()).toContain('memory-10')
  })

  it('diez palabras en BitBot y cinco niveles de esferas', async () => {
    for (let i = 0; i < 10; i++) {
      await enviarPartida(partidaBitBot(jugadorId))
    }
    for (let i = 0; i < 5; i++) {
      await enviarPartida(partidaEsferas(jugadorId))
    }
    expect(await desbloqueados()).toEqual(expect.arrayContaining(['bitbot-10', 'ball-sort-5']))
  })

  it('no se otorgan dos veces', async () => {
    await enviarPartida(partidaMemorama(jugadorId))
    await enviarPartida(partidaMemorama(jugadorId))
    const estadisticas = (
      await contextoPrueba.aplicacion.inject({
        headers: encabezadoAutorizacion('Luna'),
        method: 'GET',
        url: `/api/players/${jugadorId}/stats`,
      })
    ).json()
    expect(estadisticas.logros).toBe(2)
  })
})

describe('POST /api/players/:id/items', () => {
  const ganarBits = async (partidas: number) => {
    for (let i = 0; i < partidas; i++) {
      await enviarPartida(partidaEsferas(jugadorId, { bitsObtenidos: 5 }))
    }
  }

  it('compra un artículo con los Bits del jugador', async () => {
    await ganarBits(6)
    const respuestaPrueba = await comprar('color-mint')
    expect(respuestaPrueba.statusCode).toBe(201)
    expect(respuestaPrueba.json()).toEqual({
      estatus: 'created',
      idArticulo: 'color-mint',
      bits: 0,
    })
    expect((await perfil()).articulos).toEqual(['color-mint'])
  })

  it('comprar otra vez el mismo artículo no cobra de nuevo', async () => {
    await ganarBits(8)
    await comprar('color-mint')
    const reintento = await comprar('color-mint')
    expect(reintento.statusCode).toBe(200)
    expect(reintento.json()).toMatchObject({ estatus: 'duplicate', bits: 10 })
  })

  it('responde 409 si no alcanzan los Bits y no registra la compra', async () => {
    await ganarBits(1)
    const respuestaPrueba = await comprar('accessory-crown')
    expect(respuestaPrueba.statusCode).toBe(409)
    expect(respuestaPrueba.json().error).toBe('insufficient-bits')
    expect(await perfil()).toMatchObject({ articulos: [], progreso: { bits: 5 } })
  })

  it('rechaza artículos desconocidos', async () => {
    const respuestaPrueba = await comprar('espada-laser')
    expect(respuestaPrueba.statusCode).toBe(400)
  })
})
