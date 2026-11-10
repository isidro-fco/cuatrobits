/**
 * Archivo: PaginaPerfil.tsx
 * Módulo: frontend / pages
 * Descripción: Pantalla de perfil: nivel, experiencia, Bits, logros y recuperación.
 * Requerimientos: RF07, RF47, RF48, RIU03
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { Link } from 'react-router'

// ---------- Módulos internos ----------
import { Avatar } from '../components/Avatar'
import { BotonRegresar } from '../components/BotonRegresar'
import { IconoFlechaDerecha } from '../components/iconos'
import { MarcoPagina } from '../components/MarcoPagina'
import { GlifoPixel } from '../components/GlifoPixel'
import { BarraProgreso } from '../components/BarraProgreso'
import { SeccionRecuperacion } from '../components/SeccionRecuperacion'
import { LOGROS } from '../data/logros'
import { useJugadorActivo } from '../stores/useJugadorStore'
import { formatearNumero } from '../utils/formato'
import { calcularNivel } from '../utils/progresion'

// ---------- Componente PaginaPerfil ----------
function animo(porcentaje: number): string {
  if (porcentaje >= 75) {
    return '¡Ya casi subes de nivel!'
  }
  if (porcentaje >= 25) {
    return '¡Vas por buen camino!'
  }
  return '¡Cada partida te acerca al siguiente nivel!'
}

/**
 * Pantalla de perfil: nivel, experiencia, Bits, logros y recuperación.
 * @returns Pantalla del perfil
 * @see RF07, RF47, RF48, RIU03
 */
export function PaginaPerfil() {
  const jugador = useJugadorActivo()!
  const { nivel, xpEnNivel, requerido } = calcularNivel(jugador.xp)

  return (
    <MarcoPagina acciones={<BotonRegresar />}>
      <section className="card profile-card" aria-labelledby="profile-name">
        <Avatar id={jugador.avatar} apariencia={jugador.bitbot} tamano={150} />
        <div className="profile-card__main">
          <span className="eyebrow">Tu perfil</span>
          <h1 id="profile-name">{jugador.username}</h1>
          <span className="pill pill--blue">Nivel {nivel}</span>
          <p className="profile-card__cheer">{animo((xpEnNivel / requerido) * 100)}</p>
          <BarraProgreso
            valor={xpEnNivel}
            max={requerido}
            etiqueta="Experiencia para el siguiente nivel"
          />
          <p className="profile-card__hint">
            {xpEnNivel} / {requerido} XP para el siguiente nivel
          </p>
        </div>
        <div className="profile-card__stats">
          <div className="profile-stat profile-stat--xp">
            <GlifoPixel nombre="sparkle" />
            <strong>{formatearNumero(jugador.xp)} XP</strong>
            <span>Experiencia acumulada</span>
          </div>
          <div className="profile-stat profile-stat--bits">
            <span aria-hidden>B</span>
            <strong>{formatearNumero(jugador.bits)} Bits</strong>
            <span>Tu saldo actual</span>
            <Link to="/taller" className="btn btn--outline btn--small profile-stat__link">
              Taller de BitBot
            </Link>
          </div>
        </div>
      </section>

      <section className="achievements" aria-labelledby="achievements-title">
        <div className="achievements__head">
          <div>
            <h2 id="achievements-title">Mis logros</h2>
            <p>Celebra lo que has conseguido y descubre tus próximos retos</p>
          </div>
          <Link to="/historial" className="btn btn--primary btn--small">
            Ver mi historial
            <IconoFlechaDerecha />
          </Link>
        </div>
        <ul className="achievements__grid">
          {LOGROS.map((logro) => {
            const estaDesbloqueado = jugador.logros.includes(logro.id)
            return (
              <li
                key={logro.id}
                className={`achievement card ${estaDesbloqueado ? '' : 'achievement--locked'}`}
              >
                <span className="achievement__icon" style={{ background: logro.fondo }} aria-hidden>
                  <GlifoPixel nombre={logro.icono} />
                </span>
                <span>
                  <strong>{logro.nombre}</strong>
                  <span className="achievement__status">
                    {estaDesbloqueado ? 'Logro desbloqueado' : logro.descripcion}
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      <SeccionRecuperacion jugador={jugador} />
    </MarcoPagina>
  )
}
