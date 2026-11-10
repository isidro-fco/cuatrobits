/**
 * Archivo: rutasPartidas.ts
 * Módulo: backend / routes
 * Descripción: Rutas /api/games: registro de una partida y sincronización por lotes. Cada
 *              ruta delega en ControladorPartida.
 * Requerimientos: RF58, RF62, RIE01
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import type { FastifyInstance } from 'fastify'

// ---------- Módulos internos ----------
import type { BaseDatos } from '../config/baseDatos.js'
import { ControladorPartida } from '../controllers/ControladorPartida.js'

// ---------- Rutas de la API ----------
/**
 * Registra las rutas /api/games y /api/games/sync y las conecta con ControladorPartida.
 * @param baseDatos Conexión con la base de datos
 * @returns Complemento de Fastify con las rutas
 * @see RF58, RIE01
 */
export function rutasPartidas(baseDatos: BaseDatos) {
  const controlador = new ControladorPartida(baseDatos)
  return async (aplicacion: FastifyInstance) => {
    aplicacion.post('/api/games', (solicitud, respuesta) =>
      controlador.guardar(solicitud, respuesta),
    )
    aplicacion.post('/api/games/sync', (solicitud) => controlador.sincronizar(solicitud))
  }
}
