/**
 * Archivo: esquemas.ts
 * Módulo: backend / models
 * Descripción: Esquemas Zod que validan las solicitudes. El servidor no confía en los datos del
 *              navegador (sección 13.2).
 * Requerimientos: RF60, RNF13, RF22, RF30, RF38, RF45
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { z } from 'zod'

// ---------- Módulos internos ----------
import { esquemaToken } from './autenticacion.js'
import { IDS_ARTICULOS } from './cosmeticos.js'
import { bitsPorPartida, RESULTADOS_POR_JUEGO, xpPorPartida } from './reglas.js'

// ---------- Tipos ----------
export type DatosCrearJugador = z.infer<typeof esquemaCrearJugador>
export type DatosPartida = z.infer<typeof esquemaPartida>

// ---------- Constantes ----------
/** Longitud mínima del nombre de usuario */
export const LONGITUD_MINIMA_USERNAME = 3
/** Longitud máxima del nombre de usuario */
export const LONGITUD_MAXIMA_USERNAME = 15

/** Avatares de la colección predeterminada (deben coincidir con frontend/src/data/avatares.ts) */
export const AVATARES = ['robot', 'cat', 'dino', 'fox', 'astronaut', 'monster'] as const
/** Categorías de contenido de Arma a BitBot y Memorama */
const CATEGORIAS = [
  'animals',
  'colors',
  'fruits',
  'school',
  'transport',
  'nature',
  'space',
  'technology',
] as const
/** Duración máxima aceptada para una partida: un día */
const DURACION_MAXIMA_MS = 24 * 60 * 60 * 1000
/** Margen para relojes de dispositivos ligeramente adelantados */
const DESFASE_RELOJ_MS = 5 * 60 * 1000

/** Parejas del tablero de Memorama según la dificultad (sección 8.3) */
const PAREJAS_MEMORAMA = { easy: 4, normal: 8, hard: 12, expert: 18 } as const

/** Partidas que se aceptan en una sola sincronización */
export const MAX_LOTE_SINCRONIZACION = 100

// ---------- Funciones ----------
/**
 * Igual que en el frontend: sin distinguir mayúsculas (sección 4.1)
 * @param username Nombre de usuario
 * @returns Nombre sin espacios al inicio o al final y en minúsculas
 * @see RF02, RDC11
 */
export function normalizarUsername(username: string): string {
  return username.trim().normalize('NFC').toLocaleLowerCase('es')
}

/** Identificadores de jugadores y partidas: UUID generados por el cliente */
export const esquemaId = z.uuid({ error: 'El identificador debe ser un UUID.' })

/** Cuerpo de POST /api/players */
export const esquemaCrearJugador = z.object({
  /** Opcional: permite registrar con el mismo id un perfil creado antes en el navegador */
  id: esquemaId.optional(),
  username: z
    .string()
    .trim()
    .min(
      LONGITUD_MINIMA_USERNAME,
      `El nombre debe tener al menos ${LONGITUD_MINIMA_USERNAME} letras.`,
    )
    .max(
      LONGITUD_MAXIMA_USERNAME,
      `El nombre puede tener hasta ${LONGITUD_MAXIMA_USERNAME} letras.`,
    )
    .regex(/^[\p{L}\p{N}_]+$/u, 'Usa solo letras, números o guion bajo.'),
  avatar: z.enum(AVATARES),
  /** Token secreto que este dispositivo enviará en las solicitudes (sección 4.3) */
  token: esquemaToken,
})

/** Cuerpo de POST /api/players/recover */
export const esquemaRecuperacion = z.object({
  username: z.string().trim().min(1).max(LONGITUD_MAXIMA_USERNAME),
  codigo: z.string().trim().min(1).max(20),
  /** Token del dispositivo donde se recupera el perfil */
  token: esquemaToken,
})

/** Parámetros de consulta de GET /api/players/:id/history */
export const esquemaConsultaHistorial = z.object({
  limite: z.coerce.number().int().min(1).max(100).default(20),
  desplazamiento: z.coerce.number().int().min(0).default(0),
})

/** Cantidades enteras no negativas (XP, Bits, intentos) */
const esquemaConteo = z.number().int().min(0)

/** Campos comunes a las partidas de todos los juegos */
const base = {
  id: esquemaId,
  jugadorId: esquemaId,
  duracionMs: z.number().int().min(0).max(DURACION_MAXIMA_MS),
  xpObtenida: esquemaConteo,
  /** Las partidas guardadas antes de la etapa 4 no traen Bits */
  bitsObtenidos: esquemaConteo.optional(),
  resumen: z.string().max(200),
  jugadaEn: z.iso.datetime({ offset: true }),
}

/** Partida de Conecta 4 con sus detalles (RF22) */
const conecta4 = z.object({
  ...base,
  juego: z.literal('connect-four'),
  resultado: z.enum(['win', 'loss', 'draw']),
  detalles: z.object({
    jugadores: z.array(z.string().max(30)).length(2),
    modo: z.enum(['ai', 'local']),
    dificultad: z.enum(['easy', 'normal', 'hard']).nullable(),
    movimientos: z.number().int().min(7).max(42),
    ganador: z.string().max(30).nullable(),
  }),
})

/** Partida de Arma a BitBot con sus detalles (RF30) */
const bitbot = z.object({
  ...base,
  juego: z.literal('bitbot'),
  resultado: z.enum(['win', 'loss']),
  detalles: z.object({
    categoria: z.enum(CATEGORIAS),
    dificultad: z.enum(['easy', 'medium', 'hard']),
    palabra: z.string().min(1).max(30),
    letrasCorrectas: z.array(z.string().length(1)),
    letrasIncorrectas: z.array(z.string().length(1)).max(5),
    intentosUsados: esquemaConteo,
    errores: z.number().int().min(0).max(5),
  }),
})

/** Partida de Ordenamiento de esferas con sus detalles (RF38) */
const ordenamientoEsferas = z.object({
  ...base,
  juego: z.literal('ball-sort'),
  resultado: z.literal('completed'),
  detalles: z.object({
    colores: z.number().int().min(1).max(10),
    movimientos: z.number().int().min(1),
    estaCompletada: z.literal(true),
  }),
})

/** Partida de Memorama con sus detalles (RF45) */
const memorama = z.object({
  ...base,
  juego: z.literal('memory'),
  resultado: z.literal('completed'),
  detalles: z.object({
    categoria: z.enum(CATEGORIAS),
    dificultad: z.enum(['easy', 'normal', 'hard', 'expert']),
    parejas: z.number().int(),
    intentos: z.number().int(),
  }),
})

/** Partida terminada, con comprobaciones de coherencia entre resultado, estadísticas y XP */
export const esquemaPartida = z
  .discriminatedUnion('juego', [conecta4, bitbot, ordenamientoEsferas, memorama])
  .superRefine((partida, contextoValidacion) => {
    const problema = (mensaje: string, ruta: string[] = ['detalles']) =>
      contextoValidacion.addIssue({ code: 'custom', message: mensaje, path: ruta })

    if (!RESULTADOS_POR_JUEGO[partida.juego].includes(partida.resultado)) {
      problema('Resultado no válido para este juego.', ['resultado'])
    }
    if (partida.xpObtenida !== xpPorPartida(partida.juego, partida.resultado)) {
      problema(`La experiencia debe ser ${xpPorPartida(partida.juego, partida.resultado)}.`, [
        'xpObtenida',
      ])
    }
    if (
      partida.bitsObtenidos !== undefined &&
      partida.bitsObtenidos !== bitsPorPartida(partida.resultado)
    ) {
      problema(`Los Bits deben ser ${bitsPorPartida(partida.resultado)}.`, ['bitsObtenidos'])
    }
    if (Date.parse(partida.jugadaEn) > Date.now() + DESFASE_RELOJ_MS) {
      problema('La fecha no puede estar en el futuro.', ['jugadaEn'])
    }

    switch (partida.juego) {
      case 'connect-four': {
        const detallesActual = partida.detalles
        if ((detallesActual.modo === 'ai') !== (detallesActual.dificultad !== null)) {
          problema('Solo las partidas contra la IA tienen dificultad.')
        }
        if (
          partida.resultado === 'draw' &&
          (detallesActual.movimientos !== 42 || detallesActual.ganador !== null)
        ) {
          problema('Un empate requiere el tablero lleno.')
        }
        if (partida.resultado !== 'draw' && detallesActual.ganador === null) {
          problema('Falta el ganador.')
        }
        break
      }
      case 'bitbot': {
        const detallesInterno = partida.detalles
        if (detallesInterno.letrasIncorrectas.length !== detallesInterno.errores) {
          problema('Los errores no coinciden con las letras incorrectas.')
        }
        if (
          detallesInterno.intentosUsados !==
          detallesInterno.letrasCorrectas.length + detallesInterno.letrasIncorrectas.length
        ) {
          problema('Los intentos no coinciden.')
        }
        if (partida.resultado === 'loss' && detallesInterno.errores !== 5) {
          problema('Una derrota requiere agotar los cinco intentos.')
        }
        if (partida.resultado === 'win' && detallesInterno.errores >= 5) {
          problema('No se puede ganar sin intentos.')
        }
        break
      }
      case 'memory': {
        const detallesSiguiente = partida.detalles
        if (detallesSiguiente.parejas !== PAREJAS_MEMORAMA[detallesSiguiente.dificultad]) {
          problema('El número de parejas no corresponde a la dificultad.')
        }
        if (detallesSiguiente.intentos < detallesSiguiente.parejas) {
          problema('Se necesita al menos un intento por pareja.')
        }
        break
      }
    }
  })

/** Cada partida se valida por separado para poder rechazar solo las incorrectas */
export const esquemaSincronizacion = z.object({
  partidas: z.array(z.unknown()).min(1).max(MAX_LOTE_SINCRONIZACION),
})

/** Cuerpo de POST /api/players/:id/items */
export const esquemaComprarArticulo = z.object({
  idArticulo: z.enum(IDS_ARTICULOS, { error: 'El artículo no existe.' }),
})
