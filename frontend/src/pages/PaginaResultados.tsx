/**
 * Archivo: PaginaResultados.tsx
 * Módulo: frontend / pages
 * Descripción: Pantalla de resultados: desenlace, estadísticas y recompensas, con reiniciar y
 *              salir.
 * Requerimientos: RF53, RIU08
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import type { CSSProperties } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'

// ---------- Módulos internos ----------
import { IconoReiniciar } from '../components/iconos'
import { MarcoPagina } from '../components/MarcoPagina'
import { GlifoPixel } from '../components/GlifoPixel'
import { SpritePixel } from '../components/SpritePixel'
import { TarjetaEstadistica } from '../components/TarjetaEstadistica'
import { JUEGOS } from '../data/juegos'
import type { EstadisticaPartida } from '../games/tipos'
import { useSpriteBitBot } from '../hooks/useSpriteBitBot'
import type { IdJuego } from '../types'
import { formatearDuracion } from '../utils/formato'

// ---------- Tipos ----------
export interface EstadoResultados {
  juego: IdJuego
  /** Ruta para jugar de nuevo con la misma configuración */
  rutaRepetir: string
  desenlace: 'win' | 'loss' | 'draw' | 'completed'
  duracionMs: number
  /** Estadísticas propias del juego */
  estadisticas: EstadisticaPartida[]
  /** Mensaje adicional, por ejemplo quién ganó */
  mensaje?: string
  xp: number
  bits: number
  /** Nuevo nivel, si la partida hizo subir de nivel */
  subidaNivel?: number
  /** Nombres de los logros desbloqueados con esta partida */
  logros: string[]
}

// ---------- Constantes ----------
/** Título y mensaje de ánimo de cada desenlace */
const TITULARES: Record<EstadoResultados['desenlace'], { titulo: string; mensajeAnimo: string }> = {
  win: { titulo: '¡VICTORIA!', mensajeAnimo: '¡Lo hiciste genial!' },
  completed: { titulo: '¡COMPLETADO!', mensajeAnimo: '¡Excelente trabajo!' },
  draw: { titulo: '¡EMPATE!', mensajeAnimo: '¡Qué partida tan reñida!' },
  loss: { titulo: '¡Casi lo logras!', mensajeAnimo: '¡La próxima vez será!' },
}

/** Colores de las tarjetas de estadísticas */
const COLORES_ESTADISTICAS = ['var(--lilac)', 'var(--mint)', 'var(--orange)']
/** Colores de los papeles del confeti de victoria */
const COLORES_CONFETI = [
  'var(--blue)',
  'var(--mint)',
  'var(--yellow)',
  'var(--orange)',
  'var(--lilac)',
]

// ---------- Componente PaginaResultados ----------
/** Lluvia de píxeles para celebrar; desaparece con "Reducir animaciones" */
function Confeti() {
  return (
    <div className="confetti" aria-hidden>
      {Array.from({ length: 24 }, (_, i) => (
        <span
          key={i}
          style={
            {
              '--x': `${(i * 37) % 100}%`,
              '--delay': `${(i % 8) * 120}ms`,
              '--color': COLORES_CONFETI[i % COLORES_CONFETI.length],
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}

/**
 * Pantalla de resultados: desenlace, estadísticas y recompensas, con reiniciar y salir.
 * @returns Pantalla de resultados
 * @see RF53, RIU08
 */
export function PaginaResultados() {
  const ubicacion = useLocation()
  const navegar = useNavigate()
  const resultado = ubicacion.state as EstadoResultados | null
  const bitbot = useSpriteBitBot()
  if (!resultado) {
    return <Navigate to="/" replace />
  }

  const titular = TITULARES[resultado.desenlace]
  const juego = JUEGOS[resultado.juego]

  return (
    <MarcoPagina ancho="medium">
      {(resultado.desenlace === 'win' || resultado.desenlace === 'completed') && <Confeti />}
      <section className="results-hero">
        <div>
          <span className="eyebrow">Partida terminada · {juego.nombre}</span>
          <h1>{titular.titulo}</h1>
          <p className="results-hero__cheer">{titular.mensajeAnimo}</p>
          {resultado.mensaje && <p className="results-hero__message">{resultado.mensaje}</p>}
        </div>
        <span className="results-hero__mascot" aria-hidden>
          <SpritePixel sprite={bitbot} tamano={96} />
        </span>
      </section>

      <h2 className="results-subtitle">Resumen de la partida</h2>
      <div className="stats-row">
        <TarjetaEstadistica
          valor={formatearDuracion(resultado.duracionMs)}
          etiqueta="Tiempo total"
          color="var(--blue)"
        />
        {resultado.estadisticas.map((estadistica, i) => (
          <TarjetaEstadistica
            key={estadistica.etiqueta}
            valor={estadistica.valor}
            etiqueta={estadistica.etiqueta}
            color={COLORES_ESTADISTICAS[i % COLORES_ESTADISTICAS.length]}
          />
        ))}
      </div>

      <section className="card rewards" aria-labelledby="rewards-title">
        <h2 id="rewards-title">¡Tus recompensas!</h2>
        <div className="rewards__grid">
          <div className="reward reward--xp">
            <span className="reward__icon" aria-hidden>
              <GlifoPixel nombre="star" />
            </span>
            <span>
              <strong>+{resultado.xp} XP</strong>
              <span>Experiencia ganada</span>
            </span>
          </div>
          {resultado.bits > 0 && (
            <div className="reward reward--bits">
              <span className="reward__icon" aria-hidden>
                B
              </span>
              <span>
                <strong>+{resultado.bits} Bits</strong>
                <span>Bits obtenidos</span>
              </span>
            </div>
          )}
          {resultado.subidaNivel !== undefined && (
            <div className="reward reward--level">
              <span className="reward__icon" aria-hidden>
                <GlifoPixel nombre="triangle" />
              </span>
              <span>
                <strong>¡Nivel {resultado.subidaNivel}!</strong>
                <span>Subiste de nivel</span>
              </span>
            </div>
          )}
          {(resultado.logros ?? []).map((nombre) => (
            <div key={nombre} className="reward reward--achievement">
              <span className="reward__icon" aria-hidden>
                <GlifoPixel nombre="diamond" />
              </span>
              <span>
                <strong>¡{nombre}!</strong>
                <span>Nuevo logro desbloqueado</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="results-actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => navegar(resultado.rutaRepetir, { replace: true })}
        >
          <IconoReiniciar />
          Reiniciar partida
        </button>
        <button type="button" className="btn btn--success" onClick={() => navegar('/')}>
          Salir al lobby
        </button>
      </div>
      <p className="results-note">¡Cada partida es una nueva oportunidad para aprender!</p>
    </MarcoPagina>
  )
}
