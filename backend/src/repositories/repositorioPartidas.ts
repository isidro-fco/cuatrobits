/**
 * Archivo: repositorioPartidas.ts
 * Módulo: backend / repositories
 * Descripción: Acceso a las tablas partidas y detalles_partidas: registro e historial paginado.
 * Requerimientos: RF50, RF56, RF58, RF62, RIE02
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import type { Consultable } from '../config/baseDatos.js'
import type { DatosPartida } from '../models/esquemas.js'

// ---------- Tipos ----------
export interface FilaPartida {
  id: string
  jugador_id: string
  tipo_juego: string
  resultado: string
  duracion_ms: number
  xp_obtenida: number
  bits_obtenidos: number
  resumen: string
  jugada_en: Date
  sincronizada_en: Date
  detalles: Record<string, unknown> | null
}

export interface FilaConteoPartidas {
  tipo_juego: string
  resultado: string
  cantidad: number
}

// ---------- Consultas a la base de datos ----------
/**
 * Inserta la partida; devuelve `false` si ya existía una con el mismo id
 * @param baseDatos Conexión con la base de datos o transacción en curso
 * @param juego Partida ya validada
 * @returns true si se insertó
 * @see RF56, RF58, RF62
 */
export async function insertarPartida(
  baseDatos: Consultable,
  juego: DatosPartida,
): Promise<boolean> {
  const { filas } = await baseDatos.consulta<{ id: string }>(
    `INSERT INTO partidas (id, jugador_id, tipo_juego, resultado, duracion_ms, xp_obtenida,
                           bits_obtenidos, resumen, jugada_en)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (id) DO NOTHING
     RETURNING id`,
    [
      juego.id,
      juego.jugadorId,
      juego.juego,
      juego.resultado,
      juego.duracionMs,
      juego.xpObtenida,
      juego.bitsObtenidos ?? 0,
      juego.resumen,
      juego.jugadaEn,
    ],
  )
  if (filas.length === 0) {
    return false
  }
  await baseDatos.consulta('INSERT INTO detalles_partidas (partida_id, detalles) VALUES ($1, $2)', [
    juego.id,
    JSON.stringify(juego.detalles),
  ])
  return true
}

/**
 * Busca el jugador al que pertenece una partida.
 * @param baseDatos Conexión con la base de datos o transacción en curso
 * @param id Identificador de la partida
 * @returns Id del jugador o null si la partida no existe
 * @see RF62, RLYE02
 */
export async function buscarDuenoPartida(
  baseDatos: Consultable,
  id: string,
): Promise<string | null> {
  const { filas } = await baseDatos.consulta<{ jugador_id: string }>(
    'SELECT jugador_id FROM partidas WHERE id = $1',
    [id],
  )
  return filas[0]?.jugador_id ?? null
}

/**
 * Historial paginado del jugador, de la partida más reciente a la más antigua.
 * @param baseDatos Conexión con la base de datos o transacción en curso
 * @param jugadorId Identificador del jugador
 * @param limite Cantidad máxima de partidas por página
 * @param desplazamiento Cantidad de partidas que se omiten, desde la más reciente
 * @returns Total de partidas y la página pedida
 * @see RF50, RF57
 */
export async function listarPartidas(
  baseDatos: Consultable,
  jugadorId: string,
  limite: number,
  desplazamiento: number,
): Promise<{ total: number; partidas: FilaPartida[] }> {
  const { filas: partidas } = await baseDatos.consulta<FilaPartida>(
    `SELECT partidas.*, detalles_partidas.detalles
     FROM partidas
     LEFT JOIN detalles_partidas ON detalles_partidas.partida_id = partidas.id
     WHERE partidas.jugador_id = $1
     ORDER BY partidas.jugada_en DESC, partidas.id
     LIMIT $2 OFFSET $3`,
    [jugadorId, limite, desplazamiento],
  )
  const { filas } = await baseDatos.consulta<{ total: number }>(
    'SELECT count(*)::int AS total FROM partidas WHERE jugador_id = $1',
    [jugadorId],
  )
  return { total: filas[0].total, partidas }
}

/**
 * Cuenta las partidas del jugador por juego y resultado.
 * @param baseDatos Conexión con la base de datos o transacción en curso
 * @param jugadorId Identificador del jugador
 * @returns Una fila por combinación de juego y resultado
 * @see RF51
 */
export async function contarPartidasPorResultado(
  baseDatos: Consultable,
  jugadorId: string,
): Promise<FilaConteoPartidas[]> {
  const { filas } = await baseDatos.consulta<FilaConteoPartidas>(
    `SELECT tipo_juego, resultado, count(*)::int AS cantidad
     FROM partidas WHERE jugador_id = $1
     GROUP BY tipo_juego, resultado`,
    [jugadorId],
  )
  return filas
}
