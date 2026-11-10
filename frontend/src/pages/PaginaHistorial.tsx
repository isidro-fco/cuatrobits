/**
 * Archivo: PaginaHistorial.tsx
 * Módulo: frontend / pages
 * Descripción: Pantalla de historial: partidas, estadísticas y estado de sincronización.
 * Requerimientos: RF50, RF51, RF52, RIU04
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { useState } from 'react'

// ---------- Módulos internos ----------
import { BotonRegresar } from '../components/BotonRegresar'
import { MarcoPagina } from '../components/MarcoPagina'
import { TarjetaEstadistica } from '../components/TarjetaEstadistica'
import { JUEGOS } from '../data/juegos'
import { useHistorialStore } from '../stores/useHistorialStore'
import { sincronizarPartidasPendientes } from '../services/servicioSincronizacion'
import { useJugadorActivo } from '../stores/useJugadorStore'
import { useSincronizacionStore } from '../stores/useSincronizacionStore'
import type { Partida } from '../types'
import { formatearFecha, formatearDuracion } from '../utils/formato'

// ---------- Constantes ----------
/** Partidas por página del historial */
const TAMANO_PAGINA = 8

/** Texto y estilo de cada resultado en la lista */
const ETIQUETAS_RESULTADO: Record<Partida['resultado'], { texto: string; className: string }> = {
  win: { texto: 'Victoria', className: 'pill--mint' },
  loss: { texto: 'Derrota', className: 'pill--orange' },
  draw: { texto: 'Empate', className: 'pill--yellow' },
  completed: { texto: 'Completada', className: 'pill--blue' },
}

// ---------- Componente PaginaHistorial ----------
/**
 * Pantalla de historial: partidas paginadas, estadísticas y estado de sincronización.
 * @returns Pantalla del historial
 * @see RF50, RF51, RF52, RIU04
 */
export function PaginaHistorial() {
  const jugador = useJugadorActivo()!
  const todosRegistros = useHistorialStore((estado) => estado.registros)
  const registros = todosRegistros.filter((registro) => registro.jugadorId === jugador.id)
  // Página del historial que se muestra, desde 0
  const [pagina, asignarPagina] = useState(0)

  const cantidadPaginas = Math.max(1, Math.ceil(registros.length / TAMANO_PAGINA))
  const visibles = registros.slice(pagina * TAMANO_PAGINA, (pagina + 1) * TAMANO_PAGINA)
  const victorias = registros.filter((registro) => registro.resultado === 'win').length
  const niveles = registros.filter(
    (registro) => registro.juego === 'ball-sort' && registro.resultado === 'completed',
  ).length
  const pendientes = registros.filter(
    (registro) => registro.estadoSincronizacion === 'pending',
  ).length
  const estadoSincronizacion = useSincronizacionStore((estadoActual) => estadoActual.estado)

  // Cantidad de partidas pendientes en singular o plural
  const textoPendientes =
    pendientes === 1 ? '1 partida pendiente' : `${pendientes} partidas pendientes`
  let mensajeSincronizacion: string
  if (jugador.esRecuperacionNecesaria) {
    mensajeSincronizacion =
      'Tu perfil está protegido en otro dispositivo. Recupéralo con tu código secreto para ' +
      'guardar tus partidas en el servidor.'
  } else if (jugador.tieneConflictoNombre) {
    mensajeSincronizacion =
      'Otro jugador ya usa tu nombre en el servidor; tus partidas se guardan solo en este ' +
      'dispositivo.'
  } else if (estadoSincronizacion === 'syncing') {
    mensajeSincronizacion = 'Guardando tus partidas en el servidor…'
  } else if (pendientes === 0) {
    mensajeSincronizacion = 'Todas tus partidas están guardadas en el servidor.'
  } else if (estadoSincronizacion === 'offline') {
    mensajeSincronizacion =
      `Sin conexión: ${textoPendientes}. ` + 'Se enviarán cuando vuelva la conexión.'
  } else {
    mensajeSincronizacion = `${textoPendientes} de sincronizar.`
  }

  // Posiciones (desde 1) de la primera y la última partida de la página
  const primeraVisible = pagina * TAMANO_PAGINA + 1
  const ultimaVisible = pagina * TAMANO_PAGINA + visibles.length
  return (
    <MarcoPagina acciones={<BotonRegresar destino="/perfil" etiqueta="Volver al perfil" />}>
      <div className="page-title">
        <h1>Mi historial y estadísticas</h1>
        <p>¡Descubre cuánto has avanzado y celebra tus logros!</p>
      </div>

      <div className="stats-row">
        <TarjetaEstadistica
          valor={registros.length}
          etiqueta="Partidas jugadas"
          color="var(--blue)"
        />
        <TarjetaEstadistica valor={victorias} etiqueta="Victorias" color="var(--yellow)" />
        <TarjetaEstadistica valor={niveles} etiqueta="Niveles completados" color="var(--mint)" />
        <TarjetaEstadistica
          valor={jugador.logros.length}
          etiqueta="Logros desbloqueados"
          color="var(--lilac)"
        />
      </div>

      <div
        className="sync-banner card"
        data-state={pendientes > 0 ? estadoSincronizacion : 'done'}
        role="status"
      >
        <span>{mensajeSincronizacion}</span>
        {pendientes > 0 && !jugador.tieneConflictoNombre && !jugador.esRecuperacionNecesaria && (
          <button
            type="button"
            className="btn btn--soft btn--small"
            disabled={estadoSincronizacion === 'syncing'}
            onClick={() => void sincronizarPartidasPendientes()}
          >
            Sincronizar ahora
          </button>
        )}
      </div>

      <section className="card history" aria-labelledby="history-title">
        <h2 id="history-title">Partidas recientes</h2>
        {registros.length === 0 ? (
          <p className="empty-state">
            Aún no has jugado ninguna partida. ¡Elige una isla en el lobby para comenzar!
          </p>
        ) : (
          <>
            <div className="table-scroll">
              <table className="history__table">
                <thead>
                  <tr>
                    <th scope="col">Juego</th>
                    <th scope="col">Fecha</th>
                    <th scope="col">Resultado</th>
                    <th scope="col">Duración</th>
                    <th scope="col">Estadísticas</th>
                    <th scope="col">Recompensas</th>
                    <th scope="col">Sincronización</th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((registro) => (
                    <tr key={registro.id}>
                      <td>{JUEGOS[registro.juego].nombre}</td>
                      <td>{formatearFecha(registro.jugadaEn)}</td>
                      <td>
                        <span
                          className={`pill ${ETIQUETAS_RESULTADO[registro.resultado].className}`}
                        >
                          {ETIQUETAS_RESULTADO[registro.resultado].texto}
                        </span>
                      </td>
                      <td>{formatearDuracion(registro.duracionMs)}</td>
                      <td>{registro.resumen}</td>
                      <td className="history__xp">
                        +{registro.xpObtenida} XP
                        {registro.bitsObtenidos ? (
                          <span className="history__bits"> · +{registro.bitsObtenidos} Bits</span>
                        ) : null}
                      </td>
                      <td>
                        {registro.estadoSincronizacion === 'synced' && (
                          <span className="pill pill--mint">Sincronizado</span>
                        )}
                        {registro.estadoSincronizacion === 'pending' && (
                          <span className="pill pill--yellow">Pendiente</span>
                        )}
                        {registro.estadoSincronizacion === 'rejected' && (
                          <span className="pill pill--orange" title={registro.errorSincronizacion}>
                            Solo local
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="history__footer">
              <span>
                Mostrando {primeraVisible}–{ultimaVisible} de {registros.length} partidas
              </span>
              <span className="pager">
                <button
                  type="button"
                  aria-label="Página anterior"
                  disabled={pagina === 0}
                  onClick={() => asignarPagina(pagina - 1)}
                >
                  ‹
                </button>
                <span>{pagina + 1}</span>
                <button
                  type="button"
                  aria-label="Página siguiente"
                  disabled={pagina >= cantidadPaginas - 1}
                  onClick={() => asignarPagina(pagina + 1)}
                >
                  ›
                </button>
              </span>
            </div>
          </>
        )}
      </section>
    </MarcoPagina>
  )
}
