/**
 * Archivo: rutasSalud.ts
 * Módulo: backend / routes
 * Descripción: Ruta GET /api/health: estado del servidor y de la base de datos.
 * Requerimientos: RF59
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import type { FastifyInstance } from 'fastify'

// ---------- Módulos internos ----------
import type { BaseDatos } from '../config/baseDatos.js'

// ---------- Rutas de la API ----------
/**
 * Registra la ruta GET /api/health, que también comprueba la base de datos.
 * @param baseDatos Conexión con la base de datos
 * @returns Complemento de Fastify con la ruta
 * @see RF59
 */
export function rutasSalud(baseDatos: BaseDatos) {
  return async (aplicacion: FastifyInstance) => {
    aplicacion.get('/api/health', async (_solicitud, respuesta) => {
      try {
        await baseDatos.consulta('SELECT 1')
        return { estatus: 'ok', estadoBaseDatos: 'ok' }
      } catch {
        return respuesta.status(503).send({ estatus: 'error', estadoBaseDatos: 'unavailable' })
      }
    })
  }
}
