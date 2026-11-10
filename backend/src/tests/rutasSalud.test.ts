/**
 * Archivo: rutasSalud.test.ts
 * Módulo: backend / tests
 * Descripción: Pruebas de la ruta GET /api/health.
 * Requerimientos: RF59
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// ---------- Módulos internos ----------
import { crearAplicacionPrueba } from './ayudantesPrueba.js'

// ---------- Pruebas ----------
let contextoPrueba: Awaited<ReturnType<typeof crearAplicacionPrueba>>
beforeAll(async () => {
  contextoPrueba = await crearAplicacionPrueba()
})
afterAll(() => contextoPrueba.cerrar())

describe('GET /api/health', () => {
  it('responde con estado ok y la base de datos disponible', async () => {
    const respuestaPrueba = await contextoPrueba.aplicacion.inject({
      method: 'GET',
      url: '/api/health',
    })
    expect(respuestaPrueba.statusCode).toBe(200)
    expect(respuestaPrueba.json()).toEqual({ estatus: 'ok', estadoBaseDatos: 'ok' })
  })

  it('responde 503 si la base de datos no está disponible', async () => {
    const { construirAplicacion } = await import('../aplicacion.js')
    const aplicacion = construirAplicacion({
      esRegistroActivo: false,
      baseDatos: {
        ...contextoPrueba.baseDatos,
        consulta: () => Promise.reject(new Error('sin conexión')),
      },
    })
    const respuestaPrueba = await aplicacion.inject({ method: 'GET', url: '/api/health' })
    expect(respuestaPrueba.statusCode).toBe(503)
    await aplicacion.close()
  })
})
