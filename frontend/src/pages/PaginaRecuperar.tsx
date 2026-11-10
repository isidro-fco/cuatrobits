/**
 * Archivo: PaginaRecuperar.tsx
 * Módulo: frontend / pages
 * Descripción: Pantalla para recuperar un perfil con su nombre y código secreto.
 * Requerimientos: RNF12, RF61
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'

// ---------- Módulos internos ----------
import { IconoFlechaDerecha } from '../components/iconos'
import { MarcoPagina } from '../components/MarcoPagina'
import { ErrorApi, ErrorRed } from '../services/api'
import { recuperarPerfil } from '../services/servicioPerfiles'
import { useJugadorStore } from '../stores/useJugadorStore'
import { LONGITUD_MAXIMA_USERNAME } from '../utils/username'

// ---------- Componente PaginaRecuperar ----------
/**
 * Recupera un perfil en este dispositivo con el nombre y el código secreto
 * @returns Pantalla con el formulario de recuperación
 * @see RNF12, RF61
 */
export function PaginaRecuperar() {
  const navegar = useNavigate()
  const tienePerfil = useJugadorStore((estado) => estado.idActivo !== null)
  // Nombre escrito en el formulario
  const [username, asignarUsername] = useState('')
  // Código secreto escrito en el formulario
  const [codigo, asignarCodigo] = useState('')
  // Mensaje de error de la recuperación
  const [error, asignarError] = useState<string | null>(null)
  // Verdadero mientras se espera la respuesta del servidor
  const [estaCargando, asignarEstaCargando] = useState(false)

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault()
    if (!username.trim() || !codigo.trim()) {
      asignarError('Escribe tu nombre de jugador y tu código secreto.')
      return
    }
    asignarEstaCargando(true)
    try {
      await recuperarPerfil(username, codigo)
      navegar('/', { replace: true })
    } catch (errorCapturado) {
      asignarEstaCargando(false)
      if (errorCapturado instanceof ErrorApi) {
        asignarError(errorCapturado.message)
      } else if (errorCapturado instanceof ErrorRed) {
        asignarError('No pudimos conectar con el servidor. Inténtalo de nuevo en un momento.')
      } else {
        asignarError('Algo salió mal. Inténtalo de nuevo.')
      }
    }
  }

  const limpiar = () => asignarError(null)

  return (
    <MarcoPagina ancho="narrow">
      <form className="card register" onSubmit={manejarEnvio} noValidate>
        <div className="page-title">
          <h1>¡Hola de nuevo!</h1>
          <p>Recupera tu perfil con tu nombre y tu código secreto</p>
        </div>

        <label htmlFor="recover-username" className="field-label">
          Tu nombre de jugador
        </label>
        <input
          id="recover-username"
          className="text-input"
          autoComplete="off"
          maxLength={LONGITUD_MAXIMA_USERNAME}
          value={username}
          onChange={(evento) => {
            asignarUsername(evento.target.value)
            limpiar()
          }}
        />

        <label htmlFor="recover-code" className="field-label">
          Tu código secreto
        </label>
        <input
          id="recover-code"
          className="text-input text-input--code"
          placeholder="ABCD-EFGH"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={20}
          value={codigo}
          aria-invalid={error !== null}
          aria-describedby={error ? 'recover-error' : undefined}
          onChange={(evento) => {
            asignarCodigo(evento.target.value)
            limpiar()
          }}
        />
        <p id="recover-error" className="field-error" role="alert">
          {error}
        </p>

        <button type="submit" className="btn btn--primary btn--block" disabled={estaCargando}>
          {estaCargando ? 'Buscando tu perfil…' : 'Recuperar mi perfil'}
          <IconoFlechaDerecha />
        </button>
        <p className="register__note">
          El código aparece en tu perfil, en el dispositivo donde lo creaste.
        </p>
        <p className="register__recover">
          {tienePerfil ? (
            <Link to="/">Volver al lobby</Link>
          ) : (
            <Link to="/registro">Crear un perfil nuevo</Link>
          )}
        </p>
      </form>
    </MarcoPagina>
  )
}
