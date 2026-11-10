/**
 * Archivo: servicioSincronizacion.ts
 * Módulo: frontend / services
 * Descripción: Envío de partidas y compras pendientes al servidor (secciones 4.3, 9.4 y 13.4).
 * Requerimientos: RF54, RF55, RF56, RNF11, RE04
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import { useHistorialStore } from '../stores/useHistorialStore'
import { useJugadorStore } from '../stores/useJugadorStore'
import { useSincronizacionStore } from '../stores/useSincronizacionStore'
import type { Partida, Jugador, EstadoSync } from '../types'
import { ErrorApi, solicitudApi, ErrorRed } from './api'
import { asegurarRegistro } from './servicioPerfiles'

// ---------- Tipos ----------
interface RespuestaSincronizacion {
  resultados: {
    id: string | null
    estatus: 'created' | 'duplicate' | 'rejected'
    error?: { codigo: string; mensaje: string }
  }[]
}

// ---------- Constantes ----------
/** Partidas por solicitud de sincronización; igual al límite del servidor */
export const TAMANO_LOTE_SINCRONIZACION = 100

// ---------- Servicio ----------
const aCargaUtil = ({
  estadoSincronizacion: _estado,
  errorSincronizacion: _error,
  ...juego
}: Partida) => juego

/**
 * Envía las compras de artículos. Si el servidor no las acepta (por ejemplo, porque tiene menos
 * Bits por partidas que solo existen en este dispositivo), el artículo se conserva en local.
 */
async function sincronizarArticulos(jugadorId: string, token: string) {
  const jugador = useJugadorStore.getState().perfiles.find((jugador) => jugador.id === jugadorId)
  if (!jugador || jugador.articulosPendientes.length === 0) {
    return
  }
  const idsTerminados: string[] = []
  try {
    for (const idArticulo of jugador.articulosPendientes) {
      try {
        await solicitudApi('POST', `/api/players/${jugadorId}/items`, { idArticulo }, token)
      } catch (errorCapturado) {
        // Sin permiso no se descarta: se reintenta cuando el dispositivo vuelva a estar autorizado
        if (
          !(errorCapturado instanceof ErrorApi) ||
          errorCapturado.estatus === 401 ||
          errorCapturado.estatus === 403
        ) {
          throw errorCapturado
        }
        console.warn(
          `El servidor no registró la compra de ${idArticulo}: ${errorCapturado.message}`,
        )
      }
      idsTerminados.push(idArticulo)
    }
  } finally {
    useJugadorStore.getState().limpiarArticulosPendientes(jugadorId, idsTerminados)
  }
}

async function sincronizarJugador(jugador: Jugador, pendientes: Partida[], esReintento = false) {
  const token = await asegurarRegistro(jugador.id)
  if (!token) {
    return
  }
  try {
    for (let i = 0; i < pendientes.length; i += TAMANO_LOTE_SINCRONIZACION) {
      const lote = pendientes.slice(i, i + TAMANO_LOTE_SINCRONIZACION)
      const { resultados } = await solicitudApi<RespuestaSincronizacion>(
        'POST',
        '/api/games/sync',
        { partidas: lote.map(aCargaUtil) },
        token,
      )
      const actualizaciones = new Map<string, { estatus: EstadoSync; error?: string }>()
      resultados.forEach((resultado, indice) => {
        const id = lote[indice].id
        if (resultado.estatus === 'rejected') {
          // Si el jugador aún no existe en el servidor se reintentará más tarde
          if (resultado.error?.codigo !== 'not-found') {
            actualizaciones.set(id, { estatus: 'rejected', error: resultado.error?.mensaje })
          }
        } else {
          actualizaciones.set(id, { estatus: 'synced' })
        }
      })
      useHistorialStore.getState().asignarEstadoSincronizacion(actualizaciones)
    }
    // Después de las partidas, para que el servidor ya tenga sus Bits
    await sincronizarArticulos(jugador.id, token)
  } catch (errorCapturado) {
    // El servidor no reconoce el token (por ejemplo, se reinició la base de datos): se registra
    // otra vez, una sola
    if (esReintento || !(errorCapturado instanceof ErrorApi && errorCapturado.estatus === 401)) {
      throw errorCapturado
    }
    useJugadorStore.getState().actualizarPerfil(jugador.id, { estaRegistrado: false })
    const siguenPendientes = useHistorialStore
      .getState()
      .registros.filter(
        (registro) =>
          registro.jugadorId === jugador.id && registro.estadoSincronizacion === 'pending',
      )
    await sincronizarJugador(jugador, siguenPendientes, true)
  }
}

async function ejecutarSincronizacion() {
  const pendientes = useHistorialStore
    .getState()
    .registros.filter((registro) => registro.estadoSincronizacion === 'pending')
  const jugadores = useJugadorStore
    .getState()
    .perfiles.filter(
      (jugador) =>
        jugador.articulosPendientes.length > 0 ||
        pendientes.some((registro) => registro.jugadorId === jugador.id),
    )
  if (jugadores.length === 0) {
    return
  }
  const sincronizar = useSincronizacionStore.getState()
  sincronizar.set({ estado: 'syncing' })
  try {
    for (const jugador of jugadores) {
      await sincronizarJugador(
        jugador,
        pendientes.filter((registro) => registro.jugadorId === jugador.id),
      )
    }
    sincronizar.set({ estado: 'idle', ultimaSincronizacion: new Date().toISOString() })
  } catch (errorCapturado) {
    sincronizar.set({ estado: errorCapturado instanceof ErrorRed ? 'offline' : 'idle' })
    if (!(errorCapturado instanceof ErrorRed)) {
      console.error('Error al sincronizar', errorCapturado)
    }
  }
}

/** Sincronización en curso, para no lanzar dos a la vez */
let ejecucionActual: Promise<void> | null = null
/** Verdadero si se pidió sincronizar mientras otra estaba en curso */
let esRepeticionPendiente = false

/**
 * Envía todas las partidas y compras pendientes. Si ya hay una sincronización en curso, se repite
 * al terminar para incluir las partidas nuevas. Sin conexión, las partidas quedan pendientes para
 * otro intento.
 * @see RF54, RF55, RF56, RNF11, RE04
 */
export function sincronizarPartidasPendientes(): Promise<void> {
  if (ejecucionActual) {
    esRepeticionPendiente = true
    return ejecucionActual
  }
  ejecucionActual = ejecutarSincronizacion().finally(() => {
    ejecucionActual = null
    if (esRepeticionPendiente) {
      esRepeticionPendiente = false
      void sincronizarPartidasPendientes()
    }
  })
  return ejecucionActual
}
