/**
 * Archivo: repositorioLogros.ts
 * Módulo: backend / repositories
 * Descripción: Acceso a las tablas logros y logros_jugadores, y totales de partidas que deciden los
 *              logros.
 * Requerimientos: RF48, RIE02
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import type { Consultable } from '../config/baseDatos.js'
import type { ResumenLogros } from '../models/logros.js'
import { IDS_JUEGOS, type IdJuego } from '../models/reglas.js'

// ---------- Consultas a la base de datos ----------
/**
 * Totales de las partidas registradas que deciden los logros
 * @param baseDatos Conexión con la base de datos o transacción en curso
 * @param jugadorId Identificador del jugador
 * @returns Totales del jugador
 * @see RF48
 */
export async function resumenLogros(
  baseDatos: Consultable,
  jugadorId: string,
): Promise<ResumenLogros> {
  const { filas } = await baseDatos.consulta<{
    tipo_juego: IdJuego
    jugadas: number
    exitos: number
    parejas: number
  }>(
    `SELECT partidas.tipo_juego,
            count(*)::int AS jugadas,
            count(*) FILTER (WHERE partidas.resultado IN ('win', 'completed'))::int AS exitos,
            COALESCE(
              sum((detalles_partidas.detalles->>'parejas')::int)
                FILTER (WHERE partidas.tipo_juego = 'memory'),
              0
            )::int AS parejas
     FROM partidas
     LEFT JOIN detalles_partidas ON detalles_partidas.partida_id = partidas.id
     WHERE partidas.jugador_id = $1
     GROUP BY partidas.tipo_juego`,
    [jugadorId],
  )
  const fila = (juego: IdJuego) => filas.find((fila) => fila.tipo_juego === juego)
  return {
    partidasJugadas: filas.reduce((suma, fila) => suma + fila.jugadas, 0),
    exitosPorJuego: Object.fromEntries(
      IDS_JUEGOS.map((juego) => [juego, fila(juego)?.exitos ?? 0]),
    ) as Record<IdJuego, number>,
    parejasMemorama: fila('memory')?.parejas ?? 0,
  }
}

/**
 * Registra los logros; los que ya tenía el jugador se ignoran. Devuelve solo los nuevos.
 * @param baseDatos Conexión con la base de datos o transacción en curso
 * @param jugadorId Identificador del jugador
 * @param ids Logros cumplidos
 * @returns Ids de los logros nuevos
 * @see RF48
 */
export async function desbloquearLogros(
  baseDatos: Consultable,
  jugadorId: string,
  ids: string[],
): Promise<string[]> {
  const desbloqueados: string[] = []
  for (const id of ids) {
    const { filas } = await baseDatos.consulta<{ logro_id: string }>(
      `INSERT INTO logros_jugadores (jugador_id, logro_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING
       RETURNING logro_id`,
      [jugadorId, id],
    )
    if (filas[0]) {
      desbloqueados.push(filas[0].logro_id)
    }
  }
  return desbloqueados
}

/**
 * Logros del jugador con su fecha de desbloqueo.
 * @param baseDatos Conexión con la base de datos o transacción en curso
 * @param jugadorId Identificador del jugador
 * @returns Filas de logros_jugadores
 * @see RF48, RF57
 */
export async function listarLogros(
  baseDatos: Consultable,
  jugadorId: string,
): Promise<{ logro_id: string; desbloqueado_en: Date }[]> {
  const { filas } = await baseDatos.consulta<{ logro_id: string; desbloqueado_en: Date }>(
    `SELECT logro_id, desbloqueado_en FROM logros_jugadores
     WHERE jugador_id = $1
     ORDER BY desbloqueado_en, logro_id`,
    [jugadorId],
  )
  return filas
}

/**
 * Cuenta los logros desbloqueados por el jugador.
 * @param baseDatos Conexión con la base de datos o transacción en curso
 * @param jugadorId Identificador del jugador
 * @returns Cantidad de logros
 * @see RF51
 */
export async function contarLogros(baseDatos: Consultable, jugadorId: string): Promise<number> {
  const { filas } = await baseDatos.consulta<{ total: number }>(
    'SELECT count(*)::int AS total FROM logros_jugadores WHERE jugador_id = $1',
    [jugadorId],
  )
  return filas[0].total
}
