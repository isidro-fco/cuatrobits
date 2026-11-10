/**
 * Archivo: useSincronizacionAutomatica.ts
 * Módulo: frontend / hooks
 * Descripción: Hook que sincroniza al abrir la app, al terminar una partida, al recuperar la
 *              conexión y cada minuto.
 * Requerimientos: RF55, RIE05, RE04
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { useEffect } from 'react'

// ---------- Módulos internos ----------
import { sincronizarPartidasPendientes } from '../services/servicioSincronizacion'
import { useHistorialStore } from '../stores/useHistorialStore'
import { useJugadorStore } from '../stores/useJugadorStore'

// ---------- Constantes ----------
/** Intervalo entre intentos de sincronización (cada minuto) */
const REINTENTO_MS = 60_000

// ---------- Hook useSincronizacionAutomatica ----------
/**
 * Sincroniza al abrir la app, al terminar una partida o comprar, al recuperar la conexión y cada
 * minuto
 * @see RF55, RIE05, RE04
 */
export function useSincronizacionAutomatica() {
  const partidasPendientes = useHistorialStore(
    (estado) =>
      estado.registros.filter((registro) => registro.estadoSincronizacion === 'pending').length,
  )
  const articulosPendientes = useJugadorStore((estado) =>
    estado.perfiles.reduce((suma, jugador) => suma + jugador.articulosPendientes.length, 0),
  )

  useEffect(() => {
    if (partidasPendientes > 0 || articulosPendientes > 0) {
      void sincronizarPartidasPendientes()
    }
  }, [partidasPendientes, articulosPendientes])

  useEffect(() => {
    const sincronizar = () => void sincronizarPartidasPendientes()
    window.addEventListener('online', sincronizar)
    const id = window.setInterval(sincronizar, REINTENTO_MS)
    return () => {
      window.removeEventListener('online', sincronizar)
      window.clearInterval(id)
    }
  }, [])
}
