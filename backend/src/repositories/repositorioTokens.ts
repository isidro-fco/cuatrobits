/**
 * Archivo: repositorioTokens.ts
 * Módulo: backend / repositories
 * Descripción: Acceso a la tabla tokens_jugadores: dispositivos con sesión de cada jugador.
 * Requerimientos: RNF12, RLYE02, RIE02
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import type { Consultable } from '../config/baseDatos.js'

// ---------- Constantes ----------
/** Dispositivos con sesión por jugador; al pasar el límite se descartan los más antiguos */
const MAX_TOKENS_POR_JUGADOR = 10

// ---------- Consultas a la base de datos ----------
/**
 * Registra el token para el jugador; devuelve `false` si esa huella ya pertenece a otro jugador
 * @param baseDatos Conexión con la base de datos o transacción en curso
 * @param jugadorId Identificador del jugador
 * @param hashDelToken Huella SHA-256 del token
 * @returns true si el token quedó registrado para el jugador
 * @see RNF12, RLYE02
 */
export async function agregarToken(
  baseDatos: Consultable,
  jugadorId: string,
  hashDelToken: string,
): Promise<boolean> {
  await baseDatos.consulta(
    'INSERT INTO tokens_jugadores (hash_token, jugador_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [hashDelToken, jugadorId],
  )
  await baseDatos.consulta(
    `DELETE FROM tokens_jugadores WHERE jugador_id = $1 AND hash_token NOT IN (
       SELECT hash_token FROM tokens_jugadores
       WHERE jugador_id = $1
       ORDER BY creado_en DESC
       LIMIT $2)`,
    [jugadorId, MAX_TOKENS_POR_JUGADOR],
  )
  return (await buscarDuenoToken(baseDatos, hashDelToken)) === jugadorId
}

/**
 * Busca el jugador al que pertenece un token.
 * @param baseDatos Conexión con la base de datos o transacción en curso
 * @param hashDelToken Huella SHA-256 del token
 * @returns Id del jugador o null
 * @see RNF12, RLYE02
 */
export async function buscarDuenoToken(
  baseDatos: Consultable,
  hashDelToken: string,
): Promise<string | null> {
  const { filas } = await baseDatos.consulta<{ jugador_id: string }>(
    'SELECT jugador_id FROM tokens_jugadores WHERE hash_token = $1',
    [hashDelToken],
  )
  return filas[0]?.jugador_id ?? null
}

/**
 * Cuenta los dispositivos con sesión del jugador.
 * @param baseDatos Conexión con la base de datos o transacción en curso
 * @param jugadorId Identificador del jugador
 * @returns Cantidad de tokens
 * @see RNF12
 */
export async function contarTokens(baseDatos: Consultable, jugadorId: string): Promise<number> {
  const { filas } = await baseDatos.consulta<{ cantidad: number }>(
    'SELECT COUNT(*)::int AS cantidad FROM tokens_jugadores WHERE jugador_id = $1',
    [jugadorId],
  )
  return filas[0].cantidad
}
