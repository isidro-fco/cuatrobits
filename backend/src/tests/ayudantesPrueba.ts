/**
 * Archivo: ayudantesPrueba.ts
 * Módulo: backend / tests
 * Descripción: Utilidades de las pruebas del backend: aplicación con PGlite en memoria y el esquema
 *              real.
 * Requerimientos: RNF15
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { createHash, randomBytes, randomUUID } from 'node:crypto'

// ---------- Módulos internos ----------
import { construirAplicacion } from '../aplicacion.js'
import { crearBaseDatosPglite } from '../config/baseDatos.js'
import { migrar } from '../config/migraciones.js'

// ---------- Funciones ----------
/**
 * Aplicación con PostgreSQL en memoria (PGlite) y el esquema real
 * @returns Aplicación y base de datos de prueba
 * @see RNF15
 */
export async function crearAplicacionPrueba() {
  const baseDatos = crearBaseDatosPglite()
  await migrar(baseDatos)
  const aplicacion = construirAplicacion({ baseDatos, esRegistroActivo: false })
  return {
    aplicacion,
    baseDatos,
    async restablecer() {
      await baseDatos.ejecutar(
        `TRUNCATE jugadores, partidas, detalles_partidas, progresos, logros_jugadores,
          articulos_jugadores, tokens_jugadores CASCADE`,
      )
    },
    async cerrar() {
      await aplicacion.close()
      await baseDatos.cerrar()
    },
  }
}

/**
 * Token de dispositivo fijo para cada nombre, para no tener que guardarlo en cada prueba
 * @param username Nombre de usuario
 * @returns Token del dispositivo del jugador
 * @see RNF15
 */
export function tokenDe(username: string): string {
  return createHash('sha256').update(`prueba:${username.toLowerCase()}`).digest('base64url')
}

/**
 * Token de un dispositivo nuevo
 * @returns Token aleatorio
 * @see RNF15
 */
export const nuevoToken = () => randomBytes(32).toString('base64url')

/**
 * Cabecera de autenticación del dispositivo de ese jugador
 * @param usernameOToken Nombre del jugador o un token ya generado
 * @returns Cabecera Authorization
 * @see RNF15
 */
export const encabezadoAutorizacion = (usernameOToken: string) => {
  // Un token en base64url de 32 bytes mide 43 caracteres; cualquier otro texto es un nombre
  const token = usernameOToken.length === 43 ? usernameOToken : tokenDe(usernameOToken)
  return { authorization: `Bearer ${token}` }
}

/**
 * Partida de Conecta 4 válida para las pruebas.
 * @param jugadorId Identificador del jugador
 * @param sobrescrituras Campos que reemplazan a los de la partida de ejemplo
 * @returns Datos de la partida
 * @see RF22, RNF15
 */
export function partidaConecta4(jugadorId: string, sobrescrituras: Record<string, unknown> = {}) {
  return {
    id: randomUUID(),
    jugadorId,
    juego: 'connect-four',
    resultado: 'win',
    duracionMs: 95_000,
    xpObtenida: 25,
    resumen: 'Contra BitBot (Normal) · 13 movimientos',
    jugadaEn: new Date().toISOString(),
    detalles: {
      jugadores: ['Luna', 'BitBot'],
      modo: 'ai',
      dificultad: 'normal',
      movimientos: 13,
      ganador: 'Luna',
    },
    ...sobrescrituras,
  }
}

/**
 * Partida de Arma a BitBot válida para las pruebas.
 * @param jugadorId Identificador del jugador
 * @param sobrescrituras Campos que reemplazan a los de la partida de ejemplo
 * @returns Datos de la partida
 * @see RF30, RNF15
 */
export function partidaBitBot(jugadorId: string, sobrescrituras: Record<string, unknown> = {}) {
  return {
    id: randomUUID(),
    jugadorId,
    juego: 'bitbot',
    resultado: 'win',
    duracionMs: 40_000,
    xpObtenida: 20,
    resumen: 'Animales · GATO · 1 de 5 errores',
    jugadaEn: new Date().toISOString(),
    detalles: {
      categoria: 'animals',
      dificultad: 'easy',
      palabra: 'GATO',
      letrasCorrectas: ['G', 'A', 'T', 'O'],
      letrasIncorrectas: ['X'],
      intentosUsados: 5,
      errores: 1,
    },
    ...sobrescrituras,
  }
}

/**
 * Partida de Ordenamiento de esferas válida para las pruebas.
 * @param jugadorId Identificador del jugador
 * @param sobrescrituras Campos que reemplazan a los de la partida de ejemplo
 * @returns Datos de la partida
 * @see RF38, RNF15
 */
export function partidaEsferas(jugadorId: string, sobrescrituras: Record<string, unknown> = {}) {
  return {
    id: randomUUID(),
    jugadorId,
    juego: 'ball-sort',
    resultado: 'completed',
    duracionMs: 120_000,
    xpObtenida: 25,
    resumen: '4 colores · 30 movimientos',
    jugadaEn: new Date().toISOString(),
    detalles: { colores: 4, movimientos: 30, estaCompletada: true },
    ...sobrescrituras,
  }
}

/**
 * Partida de Memorama válida para las pruebas.
 * @param jugadorId Identificador del jugador
 * @param sobrescrituras Campos que reemplazan a los de la partida de ejemplo
 * @returns Datos de la partida
 * @see RF45, RNF15
 */
export function partidaMemorama(jugadorId: string, sobrescrituras: Record<string, unknown> = {}) {
  return {
    id: randomUUID(),
    jugadorId,
    juego: 'memory',
    resultado: 'completed',
    duracionMs: 60_000,
    xpObtenida: 20,
    resumen: 'Frutas · Fácil · 6 intentos',
    jugadaEn: new Date().toISOString(),
    detalles: { categoria: 'fruits', dificultad: 'easy', parejas: 4, intentos: 6 },
    ...sobrescrituras,
  }
}
