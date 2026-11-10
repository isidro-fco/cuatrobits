/**
 * Archivo: repositorioJugadores.ts
 * Módulo: backend / repositories
 * Descripción: Acceso a las tablas jugadores y progresos.
 * Requerimientos: RF01, RF02, RF57, RIE02, RDC11
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import type { Consultable } from '../config/baseDatos.js'

// ---------- Tipos ----------
export interface FilaJugador {
  id: string
  username: string
  username_normalizado: string
  avatar: string
  hash_recuperacion: string | null
  creado_en: Date
}

export interface JugadorConProgreso extends FilaJugador {
  xp: number
  nivel: number
  bits: number
}

// ---------- Consultas a la base de datos ----------
/**
 * Inserta el jugador; devuelve `null` si el id o el nombre normalizado ya existen
 * @param baseDatos Conexión con la base de datos o transacción en curso
 * @param jugador Id opcional, nombre, nombre normalizado y avatar
 * @returns Fila insertada o null
 * @see RF01, RF02, RDC11
 */
export async function insertarJugador(
  baseDatos: Consultable,
  jugador: { id?: string; username: string; normalizado: string; avatar: string },
): Promise<FilaJugador | null> {
  const { filas } = await baseDatos.consulta<FilaJugador>(
    `INSERT INTO jugadores (id, username, username_normalizado, avatar)
     VALUES (COALESCE($1::uuid, gen_random_uuid()), $2, $3, $4)
     ON CONFLICT DO NOTHING
     RETURNING *`,
    [jugador.id ?? null, jugador.username, jugador.normalizado, jugador.avatar],
  )
  if (filas[0]) {
    await baseDatos.consulta('INSERT INTO progresos (jugador_id) VALUES ($1)', [filas[0].id])
  }
  return filas[0] ?? null
}

/**
 * Busca un jugador con su progreso.
 * @param baseDatos Conexión con la base de datos o transacción en curso
 * @param id Identificador del jugador
 * @returns Jugador con progreso o null
 * @see RF57
 */
export async function buscarJugadorPorId(
  baseDatos: Consultable,
  id: string,
): Promise<JugadorConProgreso | null> {
  const { filas } = await baseDatos.consulta<JugadorConProgreso>(
    `SELECT jugadores.*,
            COALESCE(progresos.xp, 0) AS xp,
            COALESCE(progresos.nivel, 1) AS nivel,
            COALESCE(progresos.bits, 0) AS bits
     FROM jugadores
     LEFT JOIN progresos ON progresos.jugador_id = jugadores.id
     WHERE jugadores.id = $1`,
    [id],
  )
  return filas[0] ?? null
}

/**
 * Busca un jugador por su nombre normalizado.
 * @param baseDatos Conexión con la base de datos o transacción en curso
 * @param normalizado Nombre de usuario normalizado
 * @returns Fila del jugador o null
 * @see RF02
 */
export async function buscarJugadorPorUsername(
  baseDatos: Consultable,
  normalizado: string,
): Promise<FilaJugador | null> {
  const { filas } = await baseDatos.consulta<FilaJugador>(
    'SELECT * FROM jugadores WHERE username_normalizado = $1',
    [normalizado],
  )
  return filas[0] ?? null
}

/**
 * Guarda la huella del código solo si el jugador aún no tiene uno; devuelve si se guardó
 * @param baseDatos Conexión con la base de datos o transacción en curso
 * @param jugadorId Identificador del jugador
 * @param hash Huella del código secreto
 * @returns true si se guardó
 * @see RNF12
 */
export async function asignarHashRecuperacion(
  baseDatos: Consultable,
  jugadorId: string,
  hash: string,
): Promise<boolean> {
  const { filas } = await baseDatos.consulta(
    `UPDATE jugadores SET hash_recuperacion = $2
     WHERE id = $1 AND hash_recuperacion IS NULL
     RETURNING id`,
    [jugadorId, hash],
  )
  return filas.length > 0
}

/**
 * Suma experiencia y Bits, y recalcula el nivel con la función recibida
 * @param baseDatos Conexión con la base de datos o transacción en curso
 * @param jugadorId Identificador del jugador
 * @param recompensas Experiencia y Bits que se suman
 * @param calcularNivel Función que calcula el nivel a partir de la experiencia
 * @see RF46, RF47, RF49
 */
export async function agregarRecompensas(
  baseDatos: Consultable,
  jugadorId: string,
  recompensas: { xp: number; bits: number },
  calcularNivel: (xp: number) => number,
): Promise<void> {
  const { filas } = await baseDatos.consulta<{ xp: number }>(
    `INSERT INTO progresos (jugador_id, xp, bits) VALUES ($1, $2, $3)
     ON CONFLICT (jugador_id) DO UPDATE
       SET xp = progresos.xp + EXCLUDED.xp,
           bits = progresos.bits + EXCLUDED.bits,
           actualizado_en = now()
     RETURNING xp`,
    [jugadorId, recompensas.xp, recompensas.bits],
  )
  await baseDatos.consulta('UPDATE progresos SET nivel = $2 WHERE jugador_id = $1', [
    jugadorId,
    calcularNivel(filas[0].xp),
  ])
}

/**
 * Descuenta Bits solo si alcanzan; devuelve el saldo restante o `null` si no alcanzan
 * @param baseDatos Conexión con la base de datos o transacción en curso
 * @param jugadorId Identificador del jugador
 * @param monto Bits que se descuentan
 * @returns Saldo restante o null
 * @see RF49
 */
export async function gastarBits(
  baseDatos: Consultable,
  jugadorId: string,
  monto: number,
): Promise<number | null> {
  const { filas } = await baseDatos.consulta<{ bits: number }>(
    `UPDATE progresos SET bits = bits - $2, actualizado_en = now()
     WHERE jugador_id = $1 AND bits >= $2
     RETURNING bits`,
    [jugadorId, monto],
  )
  return filas[0]?.bits ?? null
}
