/**
 * Archivo: rutasJugadores.ts
 * Módulo: backend / routes
 * Descripción: Rutas /api/players: registro, recuperación, perfil, historial, estadísticas y
 *              compras. Cada ruta delega en ControladorJugador.
 * Requerimientos: RF57, RF49, RF61, RIE01, RLYE02
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import type { FastifyInstance } from 'fastify'

// ---------- Módulos internos ----------
import type { BaseDatos } from '../config/baseDatos.js'
import { ControladorJugador } from '../controllers/ControladorJugador.js'
import { LimitadorIntentos } from '../services/servicioRecuperacion.js'

// ---------- Rutas de la API ----------
/**
 * Registra las rutas /api/players y las conecta con los métodos de ControladorJugador.
 * @param baseDatos Conexión con la base de datos
 * @param limitador Limitador de intentos fallidos de recuperación
 * @returns Complemento de Fastify con las rutas
 * @see RF57, RF49, RIE01
 */
export function rutasJugadores(baseDatos: BaseDatos, limitador = new LimitadorIntentos()) {
  const controlador = new ControladorJugador(baseDatos, limitador)
  return async (aplicacion: FastifyInstance) => {
    aplicacion.post('/api/players', (solicitud, respuesta) =>
      controlador.crear(solicitud, respuesta),
    )
    aplicacion.post('/api/players/recover', (solicitud) => controlador.recuperar(solicitud))
    aplicacion.post('/api/players/:id/recovery-code', (solicitud, respuesta) =>
      controlador.crearCodigo(solicitud, respuesta),
    )
    aplicacion.get('/api/players/:id', (solicitud) => controlador.obtener(solicitud))
    aplicacion.get('/api/players/:id/history', (solicitud) =>
      controlador.obtenerHistorial(solicitud),
    )
    aplicacion.get('/api/players/:id/stats', (solicitud) =>
      controlador.obtenerEstadisticas(solicitud),
    )
    aplicacion.post('/api/players/:id/items', (solicitud, respuesta) =>
      controlador.comprarArticulo(solicitud, respuesta),
    )
  }
}
