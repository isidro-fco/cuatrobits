/**
 * Archivo: servicioPerfiles.ts
 * Módulo: frontend / services
 * Descripción: Registro de perfiles en el servidor, códigos de recuperación y recuperación de
 *              perfiles.
 * Requerimientos: RF01, RF02, RNF12, RIE01
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import { BITBOT_PREDETERMINADO, ARTICULOS_GRATIS } from '../data/cosmeticos'
import { JUEGOS } from '../data/juegos'
import { useHistorialStore } from '../stores/useHistorialStore'
import { useJugadorStore } from '../stores/useJugadorStore'
import type { IdAvatar, IdJuego, Partida, Jugador } from '../types'
import { generarToken } from '../utils/token'
import { ErrorApi, solicitudApi } from './api'

// ---------- Tipos ----------
export interface JugadorRegistrado {
  id: string
  username: string
  avatar: IdAvatar
  creadoEn: string
  /** Solo llega al crear el perfil */
  codigoRecuperacion?: string
}

interface PartidaRecuperada {
  id: string
  juego: IdJuego
  resultado: Partida['resultado']
  duracionMs: number
  xpObtenida: number
  bitsObtenidos: number
  resumen: string
  jugadaEn: string
  detalles: Record<string, unknown> | null
}

interface RespuestaRecuperacion {
  jugador: {
    id: string
    username: string
    avatar: IdAvatar
    creadoEn: string
    progreso: { xp: number; bits: number }
    logros: { id: string }[]
    articulos: string[]
  }
  partidas: PartidaRecuperada[]
}

// ---------- Servicio ----------
/**
 * Registra el perfil en el servidor, que verifica que el nombre esté disponible (sección 4.1),
 * junto con el token de este dispositivo (sección 4.3). Con `id` se registra un perfil que ya
 * existía en este dispositivo; repetirlo no crea duplicados. Lanza `ErrorApi` con código
 * `username-taken` si el nombre ya existe.
 * @param username Nombre de usuario
 * @param avatar Avatar elegido
 * @param token Token secreto del dispositivo
 * @param id Identificador local, para registrar un perfil creado sin conexión
 * @returns Jugador registrado y su código de recuperación
 * @see RF01, RF02, RIE01
 */
export function registrarJugador(
  username: string,
  avatar: IdAvatar,
  token: string,
  id?: string,
): Promise<JugadorRegistrado> {
  return solicitudApi<JugadorRegistrado>('POST', '/api/players', {
    id,
    username: username.trim(),
    avatar,
    token,
  })
}

const perfilReclamado = () =>
  new ErrorApi(
    409,
    'profile-claimed',
    'Este perfil ya está protegido. Recupéralo con tu código secreto.',
  )

/**
 * Devuelve el token con que el perfil se identifica ante el servidor, registrándolo si hace falta:
 * los perfiles creados antes de la etapa 3, o antes de existir la autenticación, se registran con
 * su mismo id. Devuelve `null` si otro jugador tomó el nombre o si otro dispositivo ya protegió el
 * perfil.
 * @param jugadorId Identificador del jugador
 * @returns Token del perfil o null si no se pudo registrar
 * @see RF55, RNF12
 */
export async function asegurarRegistro(jugadorId: string): Promise<string | null> {
  const jugador = useJugadorStore.getState().perfiles.find((jugador) => jugador.id === jugadorId)
  if (!jugador || jugador.tieneConflictoNombre || jugador.esRecuperacionNecesaria) {
    return null
  }
  if (jugador.estaRegistrado && jugador.tokenAutenticacion) {
    return jugador.tokenAutenticacion
  }
  const { actualizarPerfil } = useJugadorStore.getState()
  // Se guarda antes de enviarlo: si se pierde la respuesta, el reintento usa el mismo token
  const token = jugador.tokenAutenticacion ?? generarToken()
  if (!jugador.tokenAutenticacion) {
    actualizarPerfil(jugadorId, { tokenAutenticacion: token })
  }
  try {
    const { codigoRecuperacion } = await registrarJugador(
      jugador.username,
      jugador.avatar,
      token,
      jugador.id,
    )
    actualizarPerfil(jugadorId, {
      estaRegistrado: true,
      ...(codigoRecuperacion && { codigoRecuperacion }),
    })
    return token
  } catch (errorCapturado) {
    if (errorCapturado instanceof ErrorApi && errorCapturado.codigo === 'profile-claimed') {
      actualizarPerfil(jugadorId, { esRecuperacionNecesaria: true })
      return null
    }
    if (errorCapturado instanceof ErrorApi && errorCapturado.estatus === 409) {
      actualizarPerfil(jugadorId, { tieneConflictoNombre: true })
      return null
    }
    throw errorCapturado
  }
}

/**
 * Crea el código de un perfil registrado antes de existir los códigos. `ErrorApi` 409 si ya tenía
 * uno.
 * @param jugadorId Identificador del jugador
 * @returns Código secreto nuevo
 * @see RNF12
 */
export async function crearCodigoRecuperacion(jugadorId: string): Promise<string> {
  const token = await asegurarRegistro(jugadorId)
  if (!token) {
    throw perfilReclamado()
  }
  const { codigoRecuperacion } = await solicitudApi<{ codigoRecuperacion: string }>(
    'POST',
    `/api/players/${jugadorId}/recovery-code`,
    undefined,
    token,
  )
  useJugadorStore
    .getState()
    .actualizarPerfil(jugadorId, { codigoRecuperacion, esCodigoRecuperacionVisto: true })
  return codigoRecuperacion
}

/**
 * Da al código el formato con que se muestra: mayúsculas y guion, por ejemplo `abcd efgh` →
 * `ABCD-EFGH`.
 * @param codigo Código como lo escribió el jugador
 * @returns Código con formato
 * @see RNF01, RNF12
 */
export function formatearCodigoRecuperacion(codigo: string): string {
  const limpio = codigo.toUpperCase().replace(/[\s-]/g, '')
  return limpio.length > 4 ? `${limpio.slice(0, 4)}-${limpio.slice(4)}` : limpio
}

/**
 * Descarga un perfil del servidor con su nombre y código secreto, lo guarda en este dispositivo con
 * su historial y lo activa; el servidor autoriza un token nuevo para este dispositivo. Lanza
 * `ErrorApi` 401 si los datos no coinciden y 429 tras varios intentos.
 * @param username Nombre de usuario
 * @param codigo Código secreto de recuperación
 * @returns Jugador recuperado
 * @see RNF12, RF61
 */
export async function recuperarPerfil(username: string, codigo: string): Promise<Jugador> {
  const token = generarToken()
  const { jugador, partidas } = await solicitudApi<RespuestaRecuperacion>(
    'POST',
    '/api/players/recover',
    {
      username: username.trim(),
      codigo,
      token,
    },
  )
  const restaurado: Jugador = {
    id: jugador.id,
    username: jugador.username,
    avatar: jugador.avatar,
    xp: jugador.progreso.xp,
    bits: jugador.progreso.bits,
    logros: jugador.logros.map((logro) => logro.id),
    articulos: [...new Set([...ARTICULOS_GRATIS, ...jugador.articulos])],
    articulosPendientes: [],
    bitbot: { ...BITBOT_PREDETERMINADO },
    creadoEn: jugador.creadoEn,
    estaRegistrado: true,
    tokenAutenticacion: token,
    codigoRecuperacion: formatearCodigoRecuperacion(codigo),
    esCodigoRecuperacionVisto: true,
  }
  useHistorialStore.getState().combinarRegistros(
    partidas.map((partida) => ({
      id: partida.id,
      jugadorId: jugador.id,
      juego: partida.juego,
      resultado: partida.resultado,
      duracionMs: partida.duracionMs,
      xpObtenida: partida.xpObtenida,
      bitsObtenidos: partida.bitsObtenidos,
      // Las partidas guardadas antes de registrar el texto del historial no lo tienen
      resumen: partida.resumen || JUEGOS[partida.juego].nombre,
      detalles: partida.detalles ?? undefined,
      jugadaEn: partida.jugadaEn,
      estadoSincronizacion: 'synced',
    })),
  )
  useJugadorStore.getState().restaurarPerfil(restaurado)
  return restaurado
}
