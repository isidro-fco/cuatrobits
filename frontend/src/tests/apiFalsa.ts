/**
 * Archivo: apiFalsa.ts
 * Módulo: frontend / tests
 * Descripción: Servidor falso para las pruebas: imita las respuestas de la API real
 *              (backend/src/routes).
 * Requerimientos: RNF15
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import type { Partida } from '../types'
import { buscarCosmetico } from '../data/cosmeticos'
import { bitsPorPartida, xpPorPartida } from '../utils/recompensas'
import { normalizarUsername } from '../utils/username'

// ---------- Tipos ----------
interface JugadorFalso {
  id: string
  username: string
  avatar: string
}

// ---------- Funciones ----------
/** Datos del servidor falso y solicitudes recibidas */
export const apiFalsa = {
  jugadores: new Map<string, JugadorFalso>(),
  partidas: new Map<string, Omit<Partida, 'estadoSincronizacion'>>(),
  /** Compras por jugador y Bits gastados */
  articulos: new Map<string, Set<string>>(),
  gastado: new Map<string, number>(),
  /** Código secreto de cada jugador */
  codigos: new Map<string, string>(),
  /** Tokens autorizados de cada jugador */
  tokens: new Map<string, Set<string>>(),
  estaSinConexion: false,
  solicitudes: [] as { metodo: string; ruta: string; cuerpo: unknown; token?: string }[],
  restablecer() {
    this.jugadores.clear()
    this.partidas.clear()
    this.articulos.clear()
    this.gastado.clear()
    this.codigos.clear()
    this.tokens.clear()
    this.estaSinConexion = false
    this.solicitudes = []
  },
}

const json = (estatus: number, datos: unknown) =>
  new Response(JSON.stringify(datos), {
    status: estatus,
    headers: { 'Content-Type': 'application/json' },
  })

const noAutorizado = () =>
  json(401, { error: 'unauthorized', mensaje: 'Este dispositivo no tiene permiso.' })
const prohibido = () =>
  json(403, { error: 'forbidden', mensaje: 'No puedes modificar los datos de otro jugador.' })

function agregarToken(jugadorId: string, token: string) {
  apiFalsa.tokens.set(jugadorId, (apiFalsa.tokens.get(jugadorId) ?? new Set()).add(token))
}

/** Jugador dueño del token de la solicitud */
function duenoDe(opcionesSolicitud?: RequestInit): string | null {
  const encabezado = (opcionesSolicitud?.headers as Record<string, string> | undefined)
    ?.Authorization
  const token = encabezado?.replace(/^Bearer /, '')
  if (!token) {
    return null
  }
  return [...apiFalsa.tokens].find(([, tokens]) => tokens.has(token))?.[0] ?? null
}

function crearJugador(cuerpo: { id?: string; username: string; avatar: string; token: string }) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(cuerpo.token ?? '')) {
    return json(400, {
      error: 'validation-error',
      mensaje: 'El token del dispositivo no es válido.',
    })
  }
  const normalizado = normalizarUsername(cuerpo.username)
  const mismoNombre = [...apiFalsa.jugadores.values()].find(
    (jugador) => normalizarUsername(jugador.username) === normalizado,
  )
  if (mismoNombre && mismoNombre.id === cuerpo.id) {
    const tokens = apiFalsa.tokens.get(mismoNombre.id)
    if (tokens?.size && !tokens.has(cuerpo.token)) {
      return json(409, { error: 'profile-claimed', mensaje: 'Este perfil ya está protegido.' })
    }
    agregarToken(mismoNombre.id, cuerpo.token)
    return json(200, mismoNombre)
  }
  if (mismoNombre) {
    return json(409, { error: 'username-taken', mensaje: 'Ese nombre ya está en uso.' })
  }
  if (cuerpo.id && apiFalsa.jugadores.has(cuerpo.id)) {
    return json(409, { error: 'id-taken', mensaje: 'Id en uso.' })
  }
  const jugador = {
    id: cuerpo.id ?? crypto.randomUUID(),
    username: cuerpo.username,
    avatar: cuerpo.avatar,
  }
  apiFalsa.jugadores.set(jugador.id, jugador)
  agregarToken(jugador.id, cuerpo.token)
  const codigoRecuperacion = `C0DE-${apiFalsa.jugadores.size.toString().padStart(4, '0')}`
  apiFalsa.codigos.set(jugador.id, codigoRecuperacion)
  return json(201, { ...jugador, codigoRecuperacion })
}

function guardarPartida(juego: Omit<Partida, 'estadoSincronizacion'>, dueno: string) {
  if (juego.jugadorId !== dueno) {
    return {
      id: juego.id,
      estatus: 'rejected',
      error: { codigo: 'forbidden', mensaje: 'Partida de otro jugador.' },
    }
  }
  if (!apiFalsa.jugadores.has(juego.jugadorId)) {
    return {
      id: juego.id,
      estatus: 'rejected',
      error: { codigo: 'not-found', mensaje: 'No existe el jugador.' },
    }
  }
  if (apiFalsa.partidas.has(juego.id)) {
    return { id: juego.id, estatus: 'duplicate' }
  }
  const tieneBitsValidos =
    juego.bitsObtenidos === undefined || juego.bitsObtenidos === bitsPorPartida(juego.resultado)
  if (juego.xpObtenida !== xpPorPartida(juego.juego, juego.resultado) || !tieneBitsValidos) {
    return {
      id: juego.id,
      estatus: 'rejected',
      error: { codigo: 'validation-error', mensaje: 'La partida no es válida.' },
    }
  }
  apiFalsa.partidas.set(juego.id, juego)
  return { id: juego.id, estatus: 'created' }
}

function bitsDe(jugadorId: string): number {
  const ganado = [...apiFalsa.partidas.values()]
    .filter((partida) => partida.jugadorId === jugadorId)
    .reduce((suma, partida) => suma + (partida.bitsObtenidos ?? 0), 0)
  return ganado - (apiFalsa.gastado.get(jugadorId) ?? 0)
}

function comprarArticulo(jugadorId: string, idArticulo: string) {
  const articulo = buscarCosmetico(idArticulo)
  if (!apiFalsa.jugadores.has(jugadorId)) {
    return json(404, { error: 'not-found', mensaje: 'No existe el jugador.' })
  }
  if (!articulo) {
    return json(400, { error: 'validation-error', mensaje: 'El artículo no existe.' })
  }
  const idsPropios = apiFalsa.articulos.get(jugadorId) ?? new Set<string>()
  if (idsPropios.has(idArticulo)) {
    return json(200, { estatus: 'duplicate', idArticulo, bits: bitsDe(jugadorId) })
  }
  if (bitsDe(jugadorId) < articulo.precio) {
    return json(409, {
      error: 'insufficient-bits',
      mensaje: 'No tienes Bits suficientes para este artículo.',
    })
  }
  idsPropios.add(idArticulo)
  apiFalsa.articulos.set(jugadorId, idsPropios)
  apiFalsa.gastado.set(jugadorId, (apiFalsa.gastado.get(jugadorId) ?? 0) + articulo.precio)
  return json(201, { estatus: 'created', idArticulo, bits: bitsDe(jugadorId) })
}

const codigoLimpio = (codigo: string) => codigo.toUpperCase().replace(/[\s-]/g, '')

function recuperar(cuerpo: { username: string; codigo: string; token: string }) {
  const jugador = [...apiFalsa.jugadores.values()].find(
    (jugador) => normalizarUsername(jugador.username) === normalizarUsername(cuerpo.username),
  )
  const codigo = jugador && apiFalsa.codigos.get(jugador.id)
  if (!jugador || !codigo || codigoLimpio(codigo) !== codigoLimpio(cuerpo.codigo)) {
    return json(401, {
      error: 'invalid-recovery',
      mensaje: 'El nombre o el código secreto no son correctos.',
    })
  }
  agregarToken(jugador.id, cuerpo.token)
  const partidas = [...apiFalsa.partidas.values()].filter(
    (partida) => partida.jugadorId === jugador.id,
  )
  return json(200, {
    jugador: {
      ...jugador,
      creadoEn: '2026-01-01T00:00:00.000Z',
      progreso: {
        xp: partidas.reduce((suma, partida) => suma + partida.xpObtenida, 0),
        bits: bitsDe(jugador.id),
      },
      tieneCodigoRecuperacion: true,
      logros: [],
      articulos: [...(apiFalsa.articulos.get(jugador.id) ?? [])],
    },
    partidas: partidas.map(({ jugadorId: _jugadorId, ...partida }) => ({
      ...partida,
      detalles: partida.detalles ?? null,
    })),
  })
}

function crearCodigo(jugadorId: string) {
  if (!apiFalsa.jugadores.has(jugadorId)) {
    return json(404, { error: 'not-found', mensaje: 'No existe el jugador.' })
  }
  if (apiFalsa.codigos.has(jugadorId)) {
    return json(409, { error: 'code-exists', mensaje: 'Este perfil ya tiene un código secreto.' })
  }
  apiFalsa.codigos.set(jugadorId, 'NUEV-0C0D')
  return json(201, { codigoRecuperacion: 'NUEV-0C0D' })
}

/**
 * Reemplaza a fetch en las pruebas y responde como la API real.
 * @param datosEntrada URL de la solicitud
 * @param opcionesSolicitud Método, cabeceras y cuerpo
 * @returns Respuesta HTTP simulada
 * @see RNF15
 */
export async function solicitudFalsa(
  datosEntrada: RequestInfo | URL,
  opcionesSolicitud?: RequestInit,
): Promise<Response> {
  if (apiFalsa.estaSinConexion) {
    throw new TypeError('Failed to fetch')
  }
  const ruta = String(datosEntrada)
  const metodo = opcionesSolicitud?.method ?? 'GET'
  const cuerpo = opcionesSolicitud?.body ? JSON.parse(String(opcionesSolicitud.body)) : undefined
  const token = (
    opcionesSolicitud?.headers as Record<string, string> | undefined
  )?.Authorization?.replace(/^Bearer /, '')
  apiFalsa.solicitudes.push({ metodo, ruta, cuerpo, token })

  if (metodo === 'POST' && ruta === '/api/players') {
    return crearJugador(cuerpo)
  }
  if (metodo === 'POST' && ruta === '/api/players/recover') {
    return recuperar(cuerpo)
  }
  // Las demás rutas exigen el token del jugador
  const dueno = duenoDe(opcionesSolicitud)
  if (metodo === 'POST' && ruta === '/api/games/sync') {
    if (!dueno) {
      return noAutorizado()
    }
    return json(200, {
      resultados: cuerpo.partidas.map((partida: Omit<Partida, 'estadoSincronizacion'>) =>
        guardarPartida(partida, dueno),
      ),
    })
  }
  const rutaJugador = ruta.match(/^\/api\/players\/([^/]+)\//)
  if (rutaJugador && !dueno) {
    return noAutorizado()
  }
  if (rutaJugador && dueno !== rutaJugador[1]) {
    return prohibido()
  }
  const codigo = ruta.match(/^\/api\/players\/([^/]+)\/recovery-code$/)
  if (metodo === 'POST' && codigo) {
    return crearCodigo(codigo[1])
  }
  const articulos = ruta.match(/^\/api\/players\/([^/]+)\/items$/)
  if (metodo === 'POST' && articulos) {
    return comprarArticulo(articulos[1], cuerpo.idArticulo)
  }
  return json(404, { error: 'not-found', mensaje: 'Ruta desconocida' })
}
