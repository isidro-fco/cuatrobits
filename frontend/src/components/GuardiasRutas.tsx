/**
 * Archivo: GuardiasRutas.tsx
 * Módulo: frontend / components
 * Descripción: Raíz de las rutas y guardias: exige un jugador activo, aplica preferencias, audio,
 *              logros y sincronización.
 * Requerimientos: RF03, RF08, RF63, RNF04, RIE05
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { useEffect } from 'react'
import { Navigate, Outlet, useSearchParams } from 'react-router'

// ---------- Módulos internos ----------
import { useSincronizacionAutomatica } from '../hooks/useSincronizacionAutomatica'
import { PaginaRegistro } from '../pages/PaginaRegistro'
import { PantallaInactividad } from './PantallaInactividad'
import { verificarLogros } from '../services/servicioLogros'
import { instalarDesbloqueoAudio, asignarMusicaActiva } from '../services/audio'
import { useJugadorActivo, useJugadorStore } from '../stores/useJugadorStore'
import { useAjustesStore } from '../stores/useAjustesStore'

// ---------- Componente GuardiasRutas ----------
/**
 * Aplica las preferencias globales, el audio y los logros pendientes, y mantiene la sincronización
 * @returns Contenido de la ruta actual con el protector de pantalla
 * @see RF03, RF08, RF48, RF55
 */
export function Raiz() {
  const esMovimientoReducido = useAjustesStore((estado) => estado.esMovimientoReducido)
  const estaMusicaActiva = useAjustesStore((estado) => estado.estaMusicaActiva)
  const idActivo = useJugadorStore((estado) => estado.idActivo)
  useSincronizacionAutomatica()

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(esMovimientoReducido)
  }, [esMovimientoReducido])

  useEffect(() => instalarDesbloqueoAudio(), [])
  useEffect(() => asignarMusicaActiva(estaMusicaActiva), [estaMusicaActiva])

  // Los perfiles con partidas anteriores a la etapa 4 reciben los logros que ya cumplían
  useEffect(() => {
    if (idActivo) {
      verificarLogros(idActivo)
    }
  }, [idActivo])

  return (
    <>
      <Outlet />
      <PantallaInactividad />
    </>
  )
}

/**
 * Las pantallas del juego requieren un perfil activo; sin él redirige al registro.
 * @returns Pantalla solicitada o redirección al registro
 * @see RF01, RF63
 */
export function RequiereJugador() {
  const jugador = useJugadorActivo()
  return jugador ? <Outlet /> : <Navigate to="/registro" replace />
}

/**
 * El registro solo se muestra sin perfil activo, o al crear otro jugador
 * @returns Pantalla de registro o redirección al lobby
 * @see RF01, RIU01
 */
export function RutaRegistro() {
  const jugador = useJugadorActivo()
  const [parametros] = useSearchParams()
  if (jugador && parametros.get('nuevo') !== '1') {
    return <Navigate to="/" replace />
  }
  return <PaginaRegistro />
}
