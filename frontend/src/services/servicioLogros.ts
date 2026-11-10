/**
 * Archivo: servicioLogros.ts
 * Módulo: frontend / services
 * Descripción: Desbloqueo de logros a partir del historial local (sección 9.3). El servidor repite
 *              la misma evaluación con las partidas sincronizadas.
 * Requerimientos: RF48
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import { LOGROS, type Logro } from '../data/logros'
import { useHistorialStore } from '../stores/useHistorialStore'
import { useJugadorStore } from '../stores/useJugadorStore'
import { evaluarLogros, resumirPartidas } from '../utils/reglasLogros'

// ---------- Servicio ----------
/**
 * Desbloquea los logros que el jugador ya cumple y devuelve solo los nuevos
 * @param jugadorId Identificador del jugador
 * @returns Logros recién desbloqueados
 * @see RF48
 */
export function verificarLogros(jugadorId: string): Logro[] {
  const registros = useHistorialStore
    .getState()
    .registros.filter((registro) => registro.jugadorId === jugadorId)
  const nuevos = useJugadorStore
    .getState()
    .desbloquearLogros(jugadorId, evaluarLogros(resumirPartidas(registros)))
  return LOGROS.filter((logro) => nuevos.includes(logro.id))
}
