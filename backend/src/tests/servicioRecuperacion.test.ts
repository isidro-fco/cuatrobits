/**
 * Archivo: servicioRecuperacion.test.ts
 * Módulo: backend / tests
 * Descripción: Pruebas del código secreto y de la recuperación de perfiles.
 * Requerimientos: RNF12, RLYE02
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

// ---------- Módulos internos ----------
import {
  cifrarCodigoRecuperacion,
  normalizarCodigoRecuperacion,
  verificarCodigoRecuperacion,
} from '../models/recuperacion.js'
import { LimitadorIntentos } from '../services/servicioRecuperacion.js'
import {
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
// El límite de intentos dura toda la aplicación: cada prueba usa nombres propios
beforeEach(() => contextoPrueba.restablecer())
afterAll(() => contextoPrueba.cerrar())

const crearJugador = (cuerpo: { username: string } & Record<string, unknown>) =>
  contextoPrueba.aplicacion.inject({
    method: 'POST',
    url: '/api/players',
    payload: { token: tokenDe(cuerpo.username), ...cuerpo },
  })
const recuperar = (username: string, codigo: string, token = nuevoToken()) =>
  contextoPrueba.aplicacion.inject({
    method: 'POST',
    url: '/api/players/recover',
    payload: { username, codigo, token },
  })

describe('código secreto', () => {
  it('tiene el formato ABCD-EFGH sin caracteres confusos', async () => {
    const { codigoRecuperacion } = (await crearJugador({ username: 'Luna', avatar: 'cat' })).json()
    expect(codigoRecuperacion).toMatch(/^[A-HJKMNP-TW-Z2-9]{4}-[A-HJKMNP-TW-Z2-9]{4}$/)
  })

  it('se guarda cifrado y acepta minúsculas y espacios', async () => {
    const hash = await cifrarCodigoRecuperacion('ABCD-EFGH')
    expect(hash).not.toContain('ABCD')
    expect(await verificarCodigoRecuperacion(' abcd efgh ', hash)).toBe(true)
    expect(await verificarCodigoRecuperacion('ABCD-EFGJ', hash)).toBe(false)
    expect(normalizarCodigoRecuperacion('ab-cd ef')).toBe('ABCDEF')
  })

  it('solo se entrega al crear el perfil, no en los reintentos', async () => {
    const id = randomUUID()
    const primero = await crearJugador({ id, username: 'Sol', avatar: 'dino' })
    const reintento = await crearJugador({ id, username: 'Sol', avatar: 'dino' })
    expect(primero.json().codigoRecuperacion).toBeDefined()
    expect(reintento.json().codigoRecuperacion).toBeUndefined()
  })
})

describe('POST /api/players/recover', () => {
  it('devuelve el perfil completo con su historial', async () => {
    const { id, codigoRecuperacion } = (
      await crearJugador({ username: 'Luna', avatar: 'cat' })
    ).json()
    const juego = partidaMemorama(id, { bitsObtenidos: 5 })
    await contextoPrueba.aplicacion.inject({
      headers: encabezadoAutorizacion('Luna'),
      method: 'POST',
      url: '/api/games',
      payload: juego,
    })

    const respuestaPrueba = await recuperar('LUNA', codigoRecuperacion.toLowerCase())
    expect(respuestaPrueba.statusCode).toBe(200)
    const cuerpo = respuestaPrueba.json()
    expect(cuerpo.jugador).toMatchObject({
      id,
      username: 'Luna',
      avatar: 'cat',
      progreso: { xp: 20, bits: 5 },
      tieneCodigoRecuperacion: true,
      logros: [{ id: 'first-game' }, { id: 'first-win' }],
      articulos: [],
    })
    expect(cuerpo.partidas).toEqual([
      expect.objectContaining({
        id: juego.id,
        juego: 'memory',
        resumen: juego.resumen,
        bitsObtenidos: 5,
      }),
    ])
  })

  it('autoriza el token del nuevo dispositivo sin cerrar la sesión de los demás', async () => {
    const { id, codigoRecuperacion } = (
      await crearJugador({ username: 'Luna', avatar: 'cat' })
    ).json()
    const token = nuevoToken()
    expect((await recuperar('Luna', codigoRecuperacion, token)).statusCode).toBe(200)
    const get = (token: string) =>
      contextoPrueba.aplicacion.inject({
        headers: encabezadoAutorizacion(token),
        method: 'GET',
        url: `/api/players/${id}`,
      })
    expect((await get(token)).statusCode).toBe(200)
    expect((await get('Luna')).statusCode).toBe(200)
  })

  it('un código incorrecto no autoriza el token', async () => {
    const { id } = (await crearJugador({ username: 'Luna', avatar: 'cat' })).json()
    const token = nuevoToken()
    await recuperar('Luna', 'AAAA-AAAA', token)
    expect(
      (
        await contextoPrueba.aplicacion.inject({
          headers: encabezadoAutorizacion(token),
          method: 'GET',
          url: `/api/players/${id}`,
        })
      ).statusCode,
    ).toBe(401)
  })

  it('rechaza un código incorrecto o un nombre inexistente con el mismo mensaje', async () => {
    await crearJugador({ username: 'Luna', avatar: 'cat' })
    const incorrecto = await recuperar('Luna', 'AAAA-AAAA')
    const faltante = await recuperar('Nadie', 'AAAA-AAAA')
    expect(incorrecto.statusCode).toBe(401)
    expect(faltante.statusCode).toBe(401)
    expect(incorrecto.json()).toEqual(faltante.json())
  })

  it(
    'bloquea después de cinco intentos fallidos, aunque luego llegue el código ' + 'correcto',
    async () => {
      const { codigoRecuperacion } = (
        await crearJugador({ username: 'Estrella', avatar: 'cat' })
      ).json()
      for (let i = 0; i < 5; i++) {
        expect((await recuperar('Estrella', 'AAAA-AAAA')).statusCode).toBe(401)
      }
      const respuestaBloqueada = await recuperar('Estrella', codigoRecuperacion)
      expect(respuestaBloqueada.statusCode).toBe(429)
      expect(respuestaBloqueada.json().error).toBe('too-many-attempts')
    },
  )
})

describe('POST /api/players/:id/recovery-code', () => {
  it('crea el código de un perfil que no tenía y solo una vez', async () => {
    const { id } = (await crearJugador({ username: 'Nube', avatar: 'cat' })).json()
    await contextoPrueba.baseDatos.consulta(
      'UPDATE jugadores SET hash_recuperacion = NULL WHERE id = $1',
      [id],
    )
    expect(
      (
        await contextoPrueba.aplicacion.inject({
          headers: encabezadoAutorizacion('Nube'),
          method: 'GET',
          url: `/api/players/${id}`,
        })
      ).json().tieneCodigoRecuperacion,
    ).toBe(false)

    const respuestaPrueba = await contextoPrueba.aplicacion.inject({
      headers: encabezadoAutorizacion('Nube'),
      method: 'POST',
      url: `/api/players/${id}/recovery-code`,
    })
    expect(respuestaPrueba.statusCode).toBe(201)
    expect((await recuperar('Nube', respuestaPrueba.json().codigoRecuperacion)).statusCode).toBe(
      200,
    )

    const otraVez = await contextoPrueba.aplicacion.inject({
      headers: encabezadoAutorizacion('Nube'),
      method: 'POST',
      url: `/api/players/${id}/recovery-code`,
    })
    expect(otraVez.statusCode).toBe(409)
    expect(otraVez.json().error).toBe('code-exists')
  })

  it('exige el token del jugador', async () => {
    const { id } = (await crearJugador({ username: 'Nube', avatar: 'cat' })).json()
    await contextoPrueba.baseDatos.consulta(
      'UPDATE jugadores SET hash_recuperacion = NULL WHERE id = $1',
      [id],
    )
    const respuestaPrueba = await contextoPrueba.aplicacion.inject({
      method: 'POST',
      url: `/api/players/${id}/recovery-code`,
    })
    expect(respuestaPrueba.statusCode).toBe(401)
    const otro = await contextoPrueba.aplicacion.inject({
      headers: encabezadoAutorizacion('Nube'),
      method: 'POST',
      url: `/api/players/${randomUUID()}/recovery-code`,
    })
    expect(otro.statusCode).toBe(403)
  })
})

describe('LimitadorIntentos', () => {
  it('se libera al pasar la ventana de tiempo', () => {
    let ahora = 0
    const limitador = new LimitadorIntentos(2, 1000, () => ahora)
    limitador.fallar('luna')
    limitador.fallar('luna')
    expect(limitador.estaBloqueado('luna')).toBe(true)
    expect(limitador.estaBloqueado('sol')).toBe(false)
    ahora = 1001
    expect(limitador.estaBloqueado('luna')).toBe(false)
  })
})
