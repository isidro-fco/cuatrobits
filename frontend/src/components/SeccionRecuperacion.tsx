/**
 * Archivo: SeccionRecuperacion.tsx
 * Módulo: frontend / components
 * Descripción: Sección del perfil para ver o crear el código secreto de recuperación.
 * Requerimientos: RNF12
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { useState } from 'react'
import { Link } from 'react-router'

// ---------- Módulos internos ----------
import { ErrorApi, ErrorRed } from '../services/api'
import { crearCodigoRecuperacion } from '../services/servicioPerfiles'
import type { Jugador } from '../types'
import { CodigoRecuperacion } from './CodigoRecuperacion'

// ---------- Componente SeccionRecuperacion ----------
/**
 * Código secreto del perfil: se muestra solo al pedirlo, para que otros no lo vean en pantalla
 * @param props Propiedades del componente
 * @param props.jugador Jugador activo
 * @returns Sección del perfil con el código o el botón para crearlo
 * @see RNF12
 */
export function SeccionRecuperacion({ jugador }: { jugador: Jugador }) {
  // Verdadero mientras el código se muestra en pantalla
  const [esVisible, asignarEsVisible] = useState(false)
  // Verdadero mientras se pide un código nuevo al servidor
  const [estaCreando, asignarEstaCreando] = useState(false)
  // Mensaje de error al crear el código
  const [error, asignarError] = useState<string | null>(null)

  async function crear() {
    asignarEstaCreando(true)
    asignarError(null)
    try {
      await crearCodigoRecuperacion(jugador.id)
      asignarEsVisible(true)
    } catch (errorCapturado) {
      if (errorCapturado instanceof ErrorApi && errorCapturado.codigo === 'code-exists') {
        asignarError(
          'Este perfil ya tiene un código. Búscalo en el perfil del dispositivo donde lo creaste.',
        )
      } else if (errorCapturado instanceof ErrorRed) {
        asignarError('No pudimos conectar con el servidor. Inténtalo de nuevo en un momento.')
      } else {
        asignarError('Algo salió mal. Inténtalo de nuevo.')
      }
    } finally {
      asignarEstaCreando(false)
    }
  }

  let contenido
  if (jugador.codigoRecuperacion) {
    contenido = esVisible ? (
      <>
        <CodigoRecuperacion codigo={jugador.codigoRecuperacion} />
        <button
          type="button"
          className="btn btn--outline btn--small"
          onClick={() => asignarEsVisible(false)}
        >
          Ocultar código
        </button>
      </>
    ) : (
      <button
        type="button"
        className="btn btn--soft btn--small"
        onClick={() => asignarEsVisible(true)}
      >
        Mostrar mi código secreto
      </button>
    )
  } else if (jugador.esRecuperacionNecesaria) {
    contenido = (
      <p>
        Este perfil está protegido en otro dispositivo.{' '}
        <Link to="/recuperar">Recupéralo con tu código secreto</Link>.
      </p>
    )
  } else if (jugador.estaRegistrado && !jugador.tieneConflictoNombre) {
    contenido = (
      <button
        type="button"
        className="btn btn--soft btn--small"
        onClick={() => void crear()}
        disabled={estaCreando}
      >
        {estaCreando ? 'Creando…' : 'Crear mi código secreto'}
      </button>
    )
  } else {
    contenido = <p>Tu código aparecerá cuando tu perfil se guarde en el servidor.</p>
  }

  return (
    <section className="card recovery-section" aria-labelledby="recovery-title">
      <div>
        <h2 id="recovery-title">Código secreto</h2>
        <p>
          Con tu nombre y este código puedes recuperar tu perfil en otro dispositivo. ¡No se lo
          muestres a otros!
        </p>
      </div>
      <div className="recovery-section__body">
        {contenido}
        <p className="field-error" role="alert">
          {error}
        </p>
      </div>
    </section>
  )
}
