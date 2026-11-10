/**
 * Archivo: repositorioArticulos.ts
 * Módulo: backend / repositories
 * Descripción: Acceso a la tabla articulos_jugadores: compras de artículos cosméticos.
 * Requerimientos: RF49, RIE02
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import type { Consultable } from '../config/baseDatos.js'

// ---------- Consultas a la base de datos ----------
/**
 * Registra la compra; devuelve `false` si el jugador ya tenía el artículo
 * @param baseDatos Conexión con la base de datos o transacción en curso
 * @param jugadorId Identificador del jugador
 * @param idArticulo Identificador del artículo cosmético
 * @param precio Precio pagado en Bits
 * @returns true si se registró la compra
 * @see RF49
 */
export async function insertarArticulo(
  baseDatos: Consultable,
  jugadorId: string,
  idArticulo: string,
  precio: number,
): Promise<boolean> {
  const { filas } = await baseDatos.consulta(
    `INSERT INTO articulos_jugadores (jugador_id, articulo_id, precio) VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING
     RETURNING articulo_id`,
    [jugadorId, idArticulo, precio],
  )
  return filas.length > 0
}

/**
 * Artículos comprados por el jugador.
 * @param baseDatos Conexión con la base de datos o transacción en curso
 * @param jugadorId Identificador del jugador
 * @returns Ids de los artículos
 * @see RF49
 */
export async function listarArticulos(
  baseDatos: Consultable,
  jugadorId: string,
): Promise<string[]> {
  const { filas } = await baseDatos.consulta<{ articulo_id: string }>(
    `SELECT articulo_id FROM articulos_jugadores
     WHERE jugador_id = $1
     ORDER BY comprado_en, articulo_id`,
    [jugadorId],
  )
  return filas.map((fila) => fila.articulo_id)
}
