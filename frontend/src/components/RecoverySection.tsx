import { useState } from 'react'
import { Link } from 'react-router'
import { ApiError, NetworkError } from '../services/api'
import { createRecoveryCode } from '../services/profileService'
import type { Player } from '../types'
import { RecoveryCode } from './RecoveryCode'

/** Código secreto del perfil: se muestra solo al pedirlo, para que otros no lo vean en pantalla */
export function RecoverySection({ player }: { player: Player }) {
  const [visible, setVisible] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function create() {
    setCreating(true)
    setError(null)
    try {
      await createRecoveryCode(player.id)
      setVisible(true)
    } catch (err) {
      if (err instanceof ApiError && err.code === 'code-exists') {
        setError('Este perfil ya tiene un código. Búscalo en el perfil del dispositivo donde lo creaste.')
      } else if (err instanceof NetworkError) {
        setError('No pudimos conectar con el servidor. Inténtalo de nuevo en un momento.')
      } else {
        setError('Algo salió mal. Inténtalo de nuevo.')
      }
    } finally {
      setCreating(false)
    }
  }

  let content
  if (player.recoveryCode) {
    content = visible ? (
      <>
        <RecoveryCode code={player.recoveryCode} />
        <button type="button" className="btn btn--outline btn--small" onClick={() => setVisible(false)}>
          Ocultar código
        </button>
      </>
    ) : (
      <button type="button" className="btn btn--soft btn--small" onClick={() => setVisible(true)}>
        Mostrar mi código secreto
      </button>
    )
  } else if (player.needsRecovery) {
    content = (
      <p>
        Este perfil está protegido en otro dispositivo. <Link to="/recuperar">Recupéralo con tu código secreto</Link>.
      </p>
    )
  } else if (player.registered && !player.nameConflict) {
    content = (
      <button type="button" className="btn btn--soft btn--small" onClick={() => void create()} disabled={creating}>
        {creating ? 'Creando…' : 'Crear mi código secreto'}
      </button>
    )
  } else {
    content = <p>Tu código aparecerá cuando tu perfil se guarde en el servidor.</p>
  }

  return (
    <section className="card recovery-section" aria-labelledby="recovery-title">
      <div>
        <h2 id="recovery-title">Código secreto</h2>
        <p>Con tu nombre y este código puedes recuperar tu perfil en otro dispositivo. ¡No se lo muestres a otros!</p>
      </div>
      <div className="recovery-section__body">
        {content}
        <p className="field-error" role="alert">
          {error}
        </p>
      </div>
    </section>
  )
}
