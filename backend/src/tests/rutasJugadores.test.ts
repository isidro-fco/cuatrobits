/**
 * Archivo: rutasJugadores.test.ts
 * Módulo: backend / tests
 * Descripción: Pruebas de las rutas /api/players.
 * Requerimientos: RF01, RF02, RF57, RF61
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
  nuevoToken,
  tokenDe,
} from './ayudantesPrueba.js'

// ---------- Pruebas ----------
let contextoPrueba: Awaited<ReturnType<typeof crearAplicacionPrueba>>
beforeAll(async () => {
  contextoPrueba = await crearAplicacionPrueba()
})
beforeEach(() => contextoPrueba.restablecer())
afterAll(() => contextoPrueba.cerrar())

const crearJugador = (cuerpo: { username: string; token?: string } & Record<string, unknown>) =>
  contextoPrueba.aplicacion.inject({
    method: 'POST',
    url: '/api/players',
    payload: { token: tokenDe(cuerpo.username), ...cuerpo },
  })

describe('POST /api/players', () => {
  it('crea un jugador con identificador propio', async () => {
    const respuestaPrueba = await crearJugador({ username: 'Luna', avatar: 'cat' })
    expect(respuestaPrueba.statusCode).toBe(201)
    const jugador = respuestaPrueba.json()
    expect(jugador).toMatchObject({ username: 'Luna', avatar: 'cat' })
    expect(jugador.id).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('no permite nombres duplicados sin distinguir mayúsculas (sección 16.1)', async () => {
    await crearJugador({ username: 'Jugador01', avatar: 'cat' })
    const respuestaPrueba = await crearJugador({ username: 'jugador01', avatar: 'robot' })
    expect(respuestaPrueba.statusCode).toBe(409)
    expect(respuestaPrueba.json()).toMatchObject({ error: 'username-taken' })
  })

  it('acepta el id del navegador y los reintentos no crean duplicados', async () => {
    const id = randomUUID()
    const primero = await crearJugador({ id, username: 'Sol', avatar: 'dino' })
    const reintento = await crearJugador({ id, username: 'SOL', avatar: 'dino' })
    expect(primero.statusCode).toBe(201)
    expect(reintento.statusCode).toBe(200)
    expect(reintento.json()).toMatchObject({ id, username: 'Sol' })
  })

  it('con el id de un perfil protegido, otro dispositivo no puede reclamarlo', async () => {
    const id = randomUUID()
    await crearJugador({ id, username: 'Sol', avatar: 'dino' })
    const respuestaPrueba = await crearJugador({
      id,
      username: 'Sol',
      avatar: 'dino',
      token: nuevoToken(),
    })
    expect(respuestaPrueba.statusCode).toBe(409)
    expect(respuestaPrueba.json().error).toBe('profile-claimed')
  })

  it(
    'un perfil anterior a la autenticación lo reclama el primer dispositivo que lo ' + 'registra',
    async () => {
      const id = randomUUID()
      await crearJugador({ id, username: 'Sol', avatar: 'dino' })
      await contextoPrueba.baseDatos.consulta(
        'DELETE FROM tokens_jugadores WHERE jugador_id = $1',
        [id],
      )
      const token = nuevoToken()
      expect((await crearJugador({ id, username: 'Sol', avatar: 'dino', token })).statusCode).toBe(
        200,
      )
      expect(
        (
          await contextoPrueba.aplicacion.inject({
            method: 'GET',
            url: `/api/players/${id}`,
            headers: encabezadoAutorizacion(token),
          })
        ).statusCode,
      ).toBe(200)
      expect(
        (await crearJugador({ id, username: 'Sol', avatar: 'dino', token: nuevoToken() }))
          .statusCode,
      ).toBe(409)
    },
  )

  it('el servidor guarda la huella del token, no el token', async () => {
    const { id } = (await crearJugador({ username: 'Luna', avatar: 'cat' })).json()
    const { filas } = await contextoPrueba.baseDatos.consulta<{ hash_token: string }>(
      'SELECT hash_token FROM tokens_jugadores WHERE jugador_id = $1',
      [id],
    )
    expect(filas).toHaveLength(1)
    expect(filas[0].hash_token).not.toBe(tokenDe('Luna'))
    expect(filas[0].hash_token).toMatch(/^[0-9a-f]{64}$/)
  })

  it('rechaza un id que ya pertenece a otro jugador', async () => {
    const id = randomUUID()
    await crearJugador({ id, username: 'Sol', avatar: 'dino' })
    const respuestaPrueba = await crearJugador({ id, username: 'Mar', avatar: 'dino' })
    expect(respuestaPrueba.statusCode).toBe(409)
    expect(respuestaPrueba.json().error).toBe('id-taken')
  })

  it.each([
    [{ username: 'ab', avatar: 'cat' }, 'nombre corto'],
    [{ username: 'con espacio', avatar: 'cat' }, 'espacios'],
    [{ username: 'Luna', avatar: 'dragón' }, 'avatar inexistente'],
    [{ id: 'no-es-uuid', username: 'Luna', avatar: 'cat' }, 'id inválido'],
    [{ username: 'Luna', avatar: 'cat', token: 'corto' }, 'token inválido'],
  ])('valida los datos: %j (%s)', async (cuerpo) => {
    const respuestaPrueba = await crearJugador(cuerpo)
    expect(respuestaPrueba.statusCode).toBe(400)
    expect(respuestaPrueba.json().error).toBe('validation-error')
  })

  it('responde 400 ante un JSON mal formado', async () => {
    const respuestaPrueba = await contextoPrueba.aplicacion.inject({
      method: 'POST',
      url: '/api/players',
      headers: { 'content-type': 'application/json' },
      payload: '{"username":',
    })
    expect(respuestaPrueba.statusCode).toBe(400)
  })
})

describe('consultas de jugador', () => {
  it('GET /api/players/:id devuelve el perfil con su progreso', async () => {
    const { id } = (await crearJugador({ username: 'Luna', avatar: 'cat' })).json()
    const respuestaPrueba = await contextoPrueba.aplicacion.inject({
      headers: encabezadoAutorizacion('Luna'),
      method: 'GET',
      url: `/api/players/${id}`,
    })
    expect(respuestaPrueba.statusCode).toBe(200)
    expect(respuestaPrueba.json()).toMatchObject({
      id,
      username: 'Luna',
      progreso: { xp: 0, nivel: 1, bits: 0, xpParaSiguienteNivel: 100 },
    })
  })

  it('exige el token del jugador y responde 400 para un id inválido', async () => {
    const { id } = (await crearJugador({ username: 'Luna', avatar: 'cat' })).json()
    await crearJugador({ username: 'Sol', avatar: 'dino' })
    const get = (url: string, encabezados = {}) =>
      contextoPrueba.aplicacion.inject({ method: 'GET', url, headers: encabezados })
    expect((await get(`/api/players/${id}`)).statusCode).toBe(401)
    expect((await get(`/api/players/${id}/stats`, encabezadoAutorizacion('Sol'))).statusCode).toBe(
      403,
    )
    expect(
      (await get(`/api/players/${randomUUID()}`, encabezadoAutorizacion('Luna'))).statusCode,
    ).toBe(403)
    expect((await get('/api/players/123/history', encabezadoAutorizacion('Luna'))).statusCode).toBe(
      400,
    )
  })

  it('historial paginado, del más reciente al más antiguo, con los detalles', async () => {
    const { id } = (await crearJugador({ username: 'Luna', avatar: 'cat' })).json()
    const dia = (numeroDia: number) => new Date(Date.UTC(2026, 9, numeroDia)).toISOString()
    for (const [i, juego] of [partidaConecta4, partidaBitBot, partidaEsferas].entries()) {
      await contextoPrueba.aplicacion.inject({
        headers: encabezadoAutorizacion('Luna'),
        method: 'POST',
        url: '/api/games',
        payload: juego(id, { jugadaEn: dia(i + 1) }),
      })
    }
    const respuestaPrueba = await contextoPrueba.aplicacion.inject({
      headers: encabezadoAutorizacion('Luna'),
      method: 'GET',
      url: `/api/players/${id}/history?limite=2`,
    })
    expect(respuestaPrueba.statusCode).toBe(200)
    const cuerpo = respuestaPrueba.json()
    expect(cuerpo.total).toBe(3)
    expect(cuerpo.partidas.map((partida: { juego: string }) => partida.juego)).toEqual([
      'ball-sort',
      'bitbot',
    ])
    expect(cuerpo.partidas[0].detalles).toEqual({
      colores: 4,
      movimientos: 30,
      estaCompletada: true,
    })

    const pagina2 = (
      await contextoPrueba.aplicacion.inject({
        headers: encabezadoAutorizacion('Luna'),
        method: 'GET',
        url: `/api/players/${id}/history?limite=2&desplazamiento=2`,
      })
    ).json()
    expect(pagina2.partidas.map((partida: { juego: string }) => partida.juego)).toEqual([
      'connect-four',
    ])
  })

  it('estadísticas acumuladas por juego', async () => {
    const { id } = (await crearJugador({ username: 'Luna', avatar: 'cat' })).json()
    const partidas = [
      partidaConecta4(id),
      partidaConecta4(id, {
        resultado: 'loss',
        xpObtenida: 10,
        detalles: { ...partidaConecta4(id).detalles, ganador: 'BitBot' },
      }),
      partidaBitBot(id),
      partidaEsferas(id),
      partidaEsferas(id),
      partidaMemorama(id),
    ]
    await contextoPrueba.aplicacion.inject({
      headers: encabezadoAutorizacion('Luna'),
      method: 'POST',
      url: '/api/games/sync',
      payload: { partidas },
    })
    const estadisticas = (
      await contextoPrueba.aplicacion.inject({
        headers: encabezadoAutorizacion('Luna'),
        method: 'GET',
        url: `/api/players/${id}/stats`,
      })
    ).json()
    expect(estadisticas).toMatchObject({
      partidasJugadas: 6,
      victorias: 2,
      nivelesCompletados: 2,
      logros: 4, // primera partida, primera victoria, cinco partidas y una victoria en cada juego
      xp: 25 + 10 + 20 + 25 + 25 + 20,
      nivel: 2,
      porJuego: {
        'connect-four': { jugadas: 2, victorias: 1, completadas: 0 },
        bitbot: { jugadas: 1, victorias: 1, completadas: 0 },
        'ball-sort': { jugadas: 2, victorias: 0, completadas: 2 },
        memory: { jugadas: 1, victorias: 0, completadas: 1 },
      },
    })
  })
})
