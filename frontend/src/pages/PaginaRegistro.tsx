/**
 * Archivo: PaginaRegistro.tsx
 * Módulo: frontend / pages
 * Descripción: Pantalla de registro: nombre de usuario y avatar.
 * Requerimientos: RF01, RF02, RIU01, RLYE01
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'

// ---------- Módulos internos ----------
import { Avatar } from '../components/Avatar'
import { IconoFlechaDerecha, IconoPalomita } from '../components/iconos'
import { MarcoPagina } from '../components/MarcoPagina'
import { AVATARES } from '../data/avatares'
import { ErrorApi, ErrorRed } from '../services/api'
import { registrarJugador } from '../services/servicioPerfiles'
import { useJugadorStore } from '../stores/useJugadorStore'
import type { IdAvatar } from '../types'
import { generarToken } from '../utils/token'
import { LONGITUD_MAXIMA_USERNAME, validarUsername } from '../utils/username'

// ---------- Constantes ----------
/** Mensaje cuando el nombre ya existe (RF02) */
const OCUPADO = 'Ese nombre ya está en uso. ¡Prueba con otro!'

// ---------- Componente PaginaRegistro ----------
/**
 * Pantalla de registro: nombre de usuario y avatar, sin datos personales.
 * @returns Pantalla con el formulario de registro
 * @see RF01, RF02, RIU01, RLYE01
 */
export function PaginaRegistro() {
  const agregarPerfil = useJugadorStore((estado) => estado.agregarPerfil)
  const actualizarPerfil = useJugadorStore((estado) => estado.actualizarPerfil)
  const estaUsernameOcupadoLocalmente = useJugadorStore(
    (estado) => estado.estaUsernameOcupadoLocalmente,
  )
  const tienePaginaAnterior = useJugadorStore((estado) => estado.idActivo !== null)
  const navegar = useNavigate()
  // Nombre escrito en el formulario
  const [username, asignarUsername] = useState('')
  // Avatar seleccionado
  const [avatar, asignarAvatar] = useState<IdAvatar>('robot')
  // Mensaje de error de validación o del servidor
  const [error, asignarError] = useState<string | null>(null)
  // Verdadero mientras el servidor revisa el nombre
  const [estaVerificando, asignarEstaVerificando] = useState(false)

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault()
    const validacion = validarUsername(username)
    if (validacion) {
      asignarError(validacion)
      return
    }
    if (estaUsernameOcupadoLocalmente(username)) {
      asignarError(OCUPADO)
      return
    }
    // El servidor confirma que el nombre está disponible y asigna el identificador (sección 4.1)
    asignarEstaVerificando(true)
    try {
      const token = generarToken()
      const jugador = await registrarJugador(username, avatar, token)
      agregarPerfil(jugador.username, avatar, jugador.id, token)
      // El lobby muestra el código una vez para que un adulto lo guarde
      if (jugador.codigoRecuperacion) {
        actualizarPerfil(jugador.id, { codigoRecuperacion: jugador.codigoRecuperacion })
      }
      navegar('/', { replace: true })
    } catch (errorCapturado) {
      asignarEstaVerificando(false)
      if (errorCapturado instanceof ErrorApi && errorCapturado.codigo === 'username-taken') {
        asignarError(OCUPADO)
      } else if (errorCapturado instanceof ErrorRed) {
        asignarError('No pudimos conectar con el servidor. Inténtalo de nuevo en un momento.')
      } else {
        asignarError(
          errorCapturado instanceof Error
            ? errorCapturado.message
            : 'Algo salió mal. Inténtalo de nuevo.',
        )
      }
    }
  }

  return (
    <MarcoPagina ancho="narrow">
      <form className="card register" onSubmit={manejarEnvio} noValidate>
        <div className="page-title">
          <h1>¡Vamos a jugar!</h1>
          <p>Crea tu perfil para comenzar</p>
        </div>

        <label htmlFor="username" className="field-label">
          ¿Cómo te llamas?
        </label>
        <input
          id="username"
          className="text-input"
          placeholder="Escribe tu nombre de jugador"
          autoComplete="off"
          maxLength={LONGITUD_MAXIMA_USERNAME}
          value={username}
          aria-invalid={error !== null}
          aria-describedby={error ? 'username-error' : undefined}
          onChange={(evento) => {
            asignarUsername(evento.target.value)
            asignarError(null)
          }}
        />
        <p id="username-error" className="field-error" role="alert">
          {error}
        </p>

        <fieldset className="avatar-picker">
          <legend className="field-label">¡Elige tu avatar!</legend>
          <div className="avatar-picker__grid" role="radiogroup">
            {AVATARES.map((opcionAvatar) => (
              <button
                key={opcionAvatar.id}
                type="button"
                role="radio"
                aria-checked={avatar === opcionAvatar.id}
                aria-label={opcionAvatar.nombre}
                className="choice avatar-picker__option"
                style={{ background: opcionAvatar.fondo }}
                onClick={() => asignarAvatar(opcionAvatar.id)}
              >
                <Avatar id={opcionAvatar.id} tamano={72} />
                {avatar === opcionAvatar.id && (
                  <span className="choice__check">
                    <IconoPalomita />
                  </span>
                )}
              </button>
            ))}
          </div>
        </fieldset>

        <button type="submit" className="btn btn--primary btn--block" disabled={estaVerificando}>
          {estaVerificando ? 'Revisando…' : 'Crear perfil y jugar'}
          <IconoFlechaDerecha />
        </button>
        <p className="register__note">No necesitas correo electrónico</p>
        <p className="register__recover">
          ¿Ya tienes un perfil? <Link to="/recuperar">Recupéralo con tu código secreto</Link>
        </p>
        {tienePaginaAnterior && (
          <button
            type="button"
            className="btn btn--outline btn--small register__back"
            onClick={() => navegar('/')}
          >
            Volver
          </button>
        )}
      </form>
    </MarcoPagina>
  )
}
