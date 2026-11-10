/**
 * Archivo: rutasPartidas.test.ts
 * Módulo: backend / tests
 * Descripción: Pruebas de las rutas /api/games: validación, duplicados y sincronización.
 * Requerimientos: RF58, RF60, RF62
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { randomUUID } from 'node:crypto'
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
const sincronizar = (partidas: unknown[]) =>
  contextoPrueba.aplicacion.inject({
    headers: encabezadoAutorizacion('Luna'),
    method: 'POST',
    url: '/api/games/sync',
    payload: { partidas },
  })
const progreso = async () =>
  (
    await contextoPrueba.aplicacion.inject({
      headers: encabezadoAutorizacion('Luna'),
      method: 'GET',
      url: `/api/players/${jugadorId}`,
    })
  ).json().progreso

describe('POST /api/games', () => {
  it.each([
    ['Conecta 4', partidaConecta4],
    ['Arma a BitBot', partidaBitBot],
    ['Ordenamiento de esferas', partidaEsferas],
    ['Memorama', partidaMemorama],
  ])('registra una partida de %s y suma su experiencia', async (_descripcion, crearPartida) => {
    const juego = crearPartida(jugadorId)
    const respuestaPrueba = await enviarPartida(juego)
    expect(respuestaPrueba.statusCode).toBe(201)
    expect(respuestaPrueba.json()).toEqual({ id: juego.id, estatus: 'created' })
    expect((await progreso()).xp).toBe(juego.xpObtenida)
  })

  it('reenviar la misma partida no la duplica ni suma XP otra vez (sección 16.1)', async () => {
    const juego = partidaBitBot(jugadorId)
    await enviarPartida(juego)
    const reintento = await enviarPartida(juego)
    expect(reintento.statusCode).toBe(200)
    expect(reintento.json().estatus).toBe('duplicate')
    const historial = (
      await contextoPrueba.aplicacion.inject({
        headers: encabezadoAutorizacion('Luna'),
        method: 'GET',
        url: `/api/players/${jugadorId}/history`,
      })
    ).json()
    expect(historial.total).toBe(1)
    expect((await progreso()).xp).toBe(20)
  })

  it('sube de nivel al acumular experiencia', async () => {
    for (let i = 0; i < 4; i++) {
      await enviarPartida(partidaConecta4(jugadorId))
    }
    expect(await progreso()).toMatchObject({ xp: 100, nivel: 2 })
  })

  it('rechaza reutilizar el id de la partida de otro jugador', async () => {
    const otro = (
      await contextoPrueba.aplicacion.inject({
        method: 'POST',
        url: '/api/players',
        payload: { username: 'Sol', avatar: 'dino', token: tokenDe('Sol') },
      })
    ).json().id
    const juego = partidaMemorama(jugadorId)
    await enviarPartida(juego)
    const respuestaPrueba = await contextoPrueba.aplicacion.inject({
      headers: encabezadoAutorizacion('Sol'),
      method: 'POST',
      url: '/api/games',
      payload: { ...juego, jugadorId: otro },
    })
    expect(respuestaPrueba.statusCode).toBe(409)
    expect(respuestaPrueba.json().error).toBe('id-conflict')
  })
})

describe('autenticación (sección 4.3)', () => {
  it('sin token o con un token desconocido responde 401', async () => {
    const juego = partidaMemorama(jugadorId)
    const faltante = await contextoPrueba.aplicacion.inject({
      method: 'POST',
      url: '/api/games',
      payload: juego,
    })
    const desconocida = await contextoPrueba.aplicacion.inject({
      headers: encabezadoAutorizacion('Nadie'),
      method: 'POST',
      url: '/api/games',
      payload: juego,
    })
    const malformada = await contextoPrueba.aplicacion.inject({
      headers: { authorization: 'Bearer abc' },
      method: 'POST',
      url: '/api/games/sync',
      payload: { partidas: [juego] },
    })
    expect([faltante.statusCode, desconocida.statusCode, malformada.statusCode]).toEqual([
      401, 401, 401,
    ])
    expect(faltante.json().error).toBe('unauthorized')
    expect((await progreso()).xp).toBe(0)
  })

  it('no se pueden enviar partidas a nombre de otro jugador', async () => {
    const respuestaPrueba = await enviarPartida(partidaMemorama(randomUUID()))
    expect(respuestaPrueba.statusCode).toBe(403)
    expect(respuestaPrueba.json().error).toBe('forbidden')

    const { resultados } = (
      await sincronizar([partidaMemorama(randomUUID()), partidaMemorama(jugadorId)])
    ).json()
    expect(resultados.map((resultado: { estatus: string }) => resultado.estatus)).toEqual([
      'rejected',
      'created',
    ])
    expect(resultados[0].error.codigo).toBe('forbidden')
  })
})

describe('validación de partidas (sección 13.2)', () => {
  const casos: [string, () => object][] = [
    ['experiencia inflada', () => partidaMemorama(jugadorId, { xpObtenida: 500 })],
    ['resultado imposible para el juego', () => partidaEsferas(jugadorId, { resultado: 'win' })],
    ['juego desconocido', () => partidaMemorama(jugadorId, { juego: 'ajedrez' })],
    [
      'fecha en el futuro',
      () =>
        partidaMemorama(jugadorId, { jugadaEn: new Date(Date.now() + 86_400_000).toISOString() }),
    ],
    ['duración negativa', () => partidaMemorama(jugadorId, { duracionMs: -1 })],
    ['id que no es UUID', () => partidaMemorama(jugadorId, { id: 'partida-1' })],
    [
      'parejas que no corresponden a la dificultad',
      () =>
        partidaMemorama(jugadorId, {
          detalles: { categoria: 'fruits', dificultad: 'expert', parejas: 4, intentos: 6 },
        }),
    ],
    [
      'menos intentos que parejas',
      () =>
        partidaMemorama(jugadorId, {
          detalles: { categoria: 'fruits', dificultad: 'easy', parejas: 4, intentos: 2 },
        }),
    ],
    [
      'derrota en BitBot sin agotar intentos',
      () => partidaBitBot(jugadorId, { resultado: 'loss', xpObtenida: 10 }),
    ],
    [
      'empate de Conecta 4 sin tablero lleno',
      () =>
        partidaConecta4(jugadorId, {
          resultado: 'draw',
          xpObtenida: 10,
          detalles: {
            jugadores: ['Luna', 'BitBot'],
            modo: 'ai',
            dificultad: 'normal',
            movimientos: 20,
            ganador: null,
          },
        }),
    ],
    [
      'dificultad en una partida local',
      () =>
        partidaConecta4(jugadorId, {
          detalles: {
            jugadores: ['Luna', 'Jugador 2'],
            modo: 'local',
            dificultad: 'hard',
            movimientos: 13,
            ganador: 'Luna',
          },
        }),
    ],
    [
      'más de diez colores',
      () =>
        partidaEsferas(jugadorId, {
          detalles: { colores: 11, movimientos: 80, estaCompletada: true },
        }),
    ],
  ]

  it.each(casos)('rechaza: %s', async (_descripcion, construirPartida) => {
    const respuestaPrueba = await enviarPartida(construirPartida())
    expect(respuestaPrueba.statusCode).toBe(400)
    expect(respuestaPrueba.json().error).toBe('validation-error')
    expect((await progreso()).xp).toBe(0)
  })

  it('acepta un empate válido y una derrota válida', async () => {
    const draw = partidaConecta4(jugadorId, {
      resultado: 'draw',
      xpObtenida: 10,
      detalles: {
        jugadores: ['Luna', 'Jugador 2'],
        modo: 'local',
        dificultad: null,
        movimientos: 42,
        ganador: null,
      },
    })
    const loss = partidaBitBot(jugadorId, {
      resultado: 'loss',
      xpObtenida: 10,
      detalles: {
        categoria: 'animals',
        dificultad: 'easy',
        palabra: 'GATO',
        letrasCorrectas: ['A'],
        letrasIncorrectas: ['B', 'C', 'D', 'E', 'F'],
        intentosUsados: 6,
        errores: 5,
      },
    })
    expect((await enviarPartida(draw)).statusCode).toBe(201)
    expect((await enviarPartida(loss)).statusCode).toBe(201)
  })
})

describe('POST /api/games/sync', () => {
  it(
    'confirma cuáles partidas se guardaron, cuáles ya existían y cuáles se ' + 'rechazaron',
    async () => {
      const guardada = partidaEsferas(jugadorId)
      await enviarPartida(guardada)
      const nuevos = partidaMemorama(jugadorId)
      const invalido = partidaMemorama(jugadorId, { xpObtenida: 999 })

      const respuestaPrueba = await sincronizar([guardada, nuevos, invalido, 'basura'])
      expect(respuestaPrueba.statusCode).toBe(200)
      const { resultados } = respuestaPrueba.json()
      expect(resultados.map((resultado: { estatus: string }) => resultado.estatus)).toEqual([
        'duplicate',
        'created',
        'rejected',
        'rejected',
      ])
      expect(resultados[0].id).toBe(guardada.id)
      expect(resultados[2]).toMatchObject({
        id: invalido.id,
        error: { codigo: 'validation-error' },
      })
      expect(resultados[3].id).toBeNull()
      expect((await progreso()).xp).toBe(25 + 20)
    },
  )

  it('reintentar el mismo lote es idempotente', async () => {
    const partidas = [partidaConecta4(jugadorId), partidaBitBot(jugadorId)]
    await sincronizar(partidas)
    const reintento = (await sincronizar(partidas)).json()
    expect(
      reintento.resultados.every(
        (resultado: { estatus: string }) => resultado.estatus === 'duplicate',
      ),
    ).toBe(true)
    expect((await progreso()).xp).toBe(45)
  })

  it('valida el tamaño del lote', async () => {
    expect((await sincronizar([])).statusCode).toBe(400)
    expect(
      (await sincronizar(Array.from({ length: 101 }, () => partidaMemorama(jugadorId)))).statusCode,
    ).toBe(400)
  })
})
