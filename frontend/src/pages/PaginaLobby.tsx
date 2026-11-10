/**
 * Archivo: PaginaLobby.tsx
 * Módulo: frontend / pages
 * Descripción: Lobby con las cuatro islas, indicadores del jugador y opciones generales.
 * Requerimientos: RF05, RF06, RF07, RF10, RF11, RIU02
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { useState, type CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router'

// ---------- Módulos internos ----------
import { Avatar } from '../components/Avatar'
import { ArteIsla } from '../components/ArteIsla'
import { IconoEngrane, IconoUsuario, IconoUsuarios } from '../components/iconos'
import { Modal } from '../components/Modal'
import { MarcoPagina } from '../components/MarcoPagina'
import { SelectorJugador } from '../components/SelectorJugador'
import { CodigoRecuperacion } from '../components/CodigoRecuperacion'
import { BarraProgreso } from '../components/BarraProgreso'
import { PanelAjustes } from '../components/PanelAjustes'
import { ORDEN_JUEGOS, JUEGOS } from '../data/juegos'
import { useMovimientoReducido } from '../hooks/useMovimientoReducido'
import { reproducirEfecto } from '../services/audio'
import { useJugadorActivo, useJugadorStore } from '../stores/useJugadorStore'
import type { IdJuego, Jugador } from '../types'
import { formatearNumero } from '../utils/formato'
import { calcularNivel } from '../utils/progresion'

// ---------- Constantes ----------
/** Duración de la transición al entrar a una isla (RF10) */
const TRANSICION_MS = 450

// ---------- Componente PaginaLobby ----------
function InsigniaJugador({ jugador }: { jugador: Jugador }) {
  const { nivel, xpEnNivel, requerido } = calcularNivel(jugador.xp)
  return (
    <div className="player-badge card">
      <Avatar id={jugador.avatar} apariencia={jugador.bitbot} tamano={52} />
      <div className="player-badge__info">
        <strong>{jugador.username}</strong>
        <span>
          Nivel {nivel} · {xpEnNivel} / {requerido} XP
        </span>
      </div>
      <div className="player-badge__bar">
        <BarraProgreso
          valor={xpEnNivel}
          max={requerido}
          etiqueta="Experiencia para el siguiente nivel"
        />
      </div>
    </div>
  )
}

/**
 * Lobby con las cuatro islas, los indicadores del jugador y las opciones generales.
 * @returns Pantalla del lobby
 * @see RF05, RF06, RF07, RF10, RF11, RIU02
 */
export function PaginaLobby() {
  const jugador = useJugadorActivo()!
  const navegar = useNavigate()
  const esMovimientoReducido = useMovimientoReducido()
  // Isla seleccionada mientras se reproduce la transición (RF10)
  const [juegoSaliente, asignarJuegoSaliente] = useState<IdJuego | null>(null)
  // Ventana abierta: ajustes, selector de jugador o ninguna
  const [dialogo, asignarDialogo] = useState<'settings' | 'switcher' | null>(null)
  const actualizarPerfil = useJugadorStore((estado) => estado.actualizarPerfil)
  const esCodigoVisible =
    jugador.codigoRecuperacion !== undefined && !jugador.esCodigoRecuperacionVisto

  function abrirJuego(juego: IdJuego) {
    if (juegoSaliente) {
      return
    }
    reproducirEfecto('select')
    const ruta = JUEGOS[juego].rutaEntrada
    if (esMovimientoReducido) {
      navegar(ruta)
      return
    }
    asignarJuegoSaliente(juego)
    window.setTimeout(() => navegar(ruta), TRANSICION_MS)
  }

  return (
    <MarcoPagina
      acciones={
        <>
          <InsigniaJugador jugador={jugador} />
          <Link
            to="/taller"
            className="bits-badge bits-badge--link"
            aria-label={`${jugador.bits} Bits. Abrir el taller de BitBot`}
          >
            <span className="bits-badge__coin" aria-hidden>
              B
            </span>
            {formatearNumero(jugador.bits)} Bits
          </Link>
          <Link to="/perfil" className="btn btn--outline btn--small">
            <IconoUsuario />
            Perfil
          </Link>
          <button
            type="button"
            className="btn btn--outline btn--small"
            onClick={() => asignarDialogo('settings')}
          >
            <IconoEngrane />
            Configuración
          </button>
          <button
            type="button"
            className="btn btn--outline btn--small"
            onClick={() => asignarDialogo('switcher')}
          >
            <IconoUsuarios />
            Cambiar jugador
          </button>
        </>
      }
    >
      <div className="page-title">
        <h1>¡Elige un minijuego!</h1>
        <p>Explora las islas y diviértete aprendiendo</p>
      </div>

      <nav aria-label="Minijuegos" className={`islands ${juegoSaliente ? 'islands--leaving' : ''}`}>
        {ORDEN_JUEGOS.map((id) => {
          const juego = JUEGOS[id]
          return (
            <button
              key={id}
              type="button"
              className={`island ${juegoSaliente === id ? 'island--selected' : ''}`}
              style={{ '--island': juego.colorIsla, '--label': juego.color } as CSSProperties}
              onClick={() => abrirJuego(id)}
              disabled={juegoSaliente !== null && juegoSaliente !== id}
            >
              <ArteIsla juego={id} />
              <span className="island__platform" aria-hidden>
                <span className="island__top" />
                <span className="island__soil" />
              </span>
              <span className="island__label">{juego.nombre}</span>
            </button>
          )
        })}
      </nav>

      <Modal
        estaAbierto={dialogo === 'settings'}
        alCerrar={() => asignarDialogo(null)}
        etiquetadoPor="settings-title"
      >
        <PanelAjustes />
        <button
          type="button"
          className="btn btn--primary btn--block modal__close"
          onClick={() => asignarDialogo(null)}
        >
          Listo
        </button>
      </Modal>
      <Modal
        estaAbierto={esCodigoVisible && dialogo === null}
        alCerrar={() => actualizarPerfil(jugador.id, { esCodigoRecuperacionVisto: true })}
        etiquetadoPor="code-title"
      >
        <div className="code-notice">
          <h2 id="code-title">¡Guarda tu código secreto!</h2>
          <p>
            Pídele a un adulto que lo anote. Con tu nombre y este código puedes recuperar tu perfil
            en otro dispositivo.
          </p>
          <CodigoRecuperacion codigo={jugador.codigoRecuperacion ?? ''} />
          <p className="code-notice__hint">También lo encuentras en tu perfil.</p>
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={() => actualizarPerfil(jugador.id, { esCodigoRecuperacionVisto: true })}
          >
            Ya lo guardé
          </button>
        </div>
      </Modal>
      <Modal
        estaAbierto={dialogo === 'switcher'}
        alCerrar={() => asignarDialogo(null)}
        etiquetadoPor="switcher-title"
      >
        <SelectorJugador alTerminar={() => asignarDialogo(null)} />
      </Modal>
    </MarcoPagina>
  )
}
