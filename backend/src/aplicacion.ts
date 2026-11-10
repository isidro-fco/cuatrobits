/**
 * Archivo: aplicacion.ts
 * Módulo: backend
 * Descripción: Construye la aplicación Fastify: CORS, base de datos, manejador de errores y rutas
 *              de la API REST.
 * Requerimientos: RF57, RF58, RF59, RIE01, RDC06, RDC08
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import cors from '@fastify/cors'
import Fastify from 'fastify'

// ---------- Módulos internos ----------
import type { BaseDatos } from './config/baseDatos.js'
import { entorno } from './config/entorno.js'
import { manejadorErrores } from './middleware/manejadorErrores.js'
import { rutasPartidas } from './routes/rutasPartidas.js'
import { rutasSalud } from './routes/rutasSalud.js'
import { rutasJugadores } from './routes/rutasJugadores.js'

// ---------- Tipos ----------
export interface OpcionesAplicacion {
  baseDatos: BaseDatos
  /** Verdadero para registrar las solicitudes en la consola */
  esRegistroActivo?: boolean
}

// ---------- Funciones ----------
/**
 * Construye la aplicación Fastify con CORS, el manejador de errores y las rutas.
 * @param opciones Opciones
 * @param opciones.baseDatos Conexión con la base de datos
 * @param opciones.esRegistroActivo Verdadero para registrar las solicitudes (falso en las pruebas)
 * @returns Aplicación lista para escuchar o para inyectar solicitudes en las pruebas
 * @see RF57, RF58, RF59, RDC08
 */
export function construirAplicacion({
  baseDatos,
  esRegistroActivo = process.env.NODE_ENV !== 'test',
}: OpcionesAplicacion) {
  const aplicacion = Fastify({ logger: esRegistroActivo })

  aplicacion.register(cors, {
    origin: entorno.CORS_ORIGIN.split(',').map((origenPermitido) =>
      origenPermitido.trim().replace(/\/$/, ''),
    ),
  })
  aplicacion.setErrorHandler(manejadorErrores)
  aplicacion.register(rutasSalud(baseDatos))
  aplicacion.register(rutasJugadores(baseDatos))
  aplicacion.register(rutasPartidas(baseDatos))

  return aplicacion
}
