import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowRight } from '../components/icons'
import { PageShell } from '../components/PageShell'
import { ApiError, NetworkError } from '../services/api'
import { recoverProfile } from '../services/profileService'
import { usePlayerStore } from '../stores/playerStore'
import { USERNAME_MAX } from '../utils/username'

/** Recupera un perfil en este dispositivo con el nombre y el código secreto */
export function RecoverPage() {
  const navigate = useNavigate()
  const hasProfile = usePlayerStore((s) => s.activeId !== null)
  const [username, setUsername] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!username.trim() || !code.trim()) {
      setError('Escribe tu nombre de jugador y tu código secreto.')
      return
    }
    setLoading(true)
    try {
      await recoverProfile(username, code)
      navigate('/', { replace: true })
    } catch (err) {
      setLoading(false)
      if (err instanceof ApiError) setError(err.message)
      else if (err instanceof NetworkError) setError('No pudimos conectar con el servidor. Inténtalo de nuevo en un momento.')
      else setError('Algo salió mal. Inténtalo de nuevo.')
    }
  }

  const clear = () => setError(null)

  return (
    <PageShell width="narrow">
      <form className="card register" onSubmit={handleSubmit} noValidate>
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
          maxLength={USERNAME_MAX}
          value={username}
          onChange={(e) => {
            setUsername(e.target.value)
            clear()
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
          value={code}
          aria-invalid={error !== null}
          aria-describedby={error ? 'recover-error' : undefined}
          onChange={(e) => {
            setCode(e.target.value)
            clear()
          }}
        />
        <p id="recover-error" className="field-error" role="alert">
          {error}
        </p>

        <button type="submit" className="btn btn--primary btn--block" disabled={loading}>
          {loading ? 'Buscando tu perfil…' : 'Recuperar mi perfil'}
          <ArrowRight />
        </button>
        <p className="register__note">El código aparece en tu perfil, en el dispositivo donde lo creaste.</p>
        <p className="register__recover">
          {hasProfile ? <Link to="/">Volver al lobby</Link> : <Link to="/registro">Crear un perfil nuevo</Link>}
        </p>
      </form>
    </PageShell>
  )
}
