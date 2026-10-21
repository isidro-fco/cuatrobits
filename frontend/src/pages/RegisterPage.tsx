import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Avatar } from '../components/Avatar'
import { ArrowRight, Check } from '../components/icons'
import { PageShell } from '../components/PageShell'
import { AVATARS } from '../data/avatars'
import { ApiError, NetworkError } from '../services/api'
import { registerPlayer } from '../services/profileService'
import { usePlayerStore } from '../stores/playerStore'
import type { AvatarId } from '../types'
import { generateToken } from '../utils/token'
import { USERNAME_MAX, validateUsername } from '../utils/username'

const TAKEN = 'Ese nombre ya está en uso. ¡Prueba con otro!'

export function RegisterPage() {
  const addProfile = usePlayerStore((s) => s.addProfile)
  const updateProfile = usePlayerStore((s) => s.updateProfile)
  const isUsernameTakenLocally = usePlayerStore((s) => s.isUsernameTakenLocally)
  const canGoBack = usePlayerStore((s) => s.activeId !== null)
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState<AvatarId>('robot')
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const validation = validateUsername(username)
    if (validation) {
      setError(validation)
      return
    }
    if (isUsernameTakenLocally(username)) {
      setError(TAKEN)
      return
    }
    // El servidor confirma que el nombre está disponible y asigna el identificador (sección 4.1)
    setChecking(true)
    try {
      const token = generateToken()
      const player = await registerPlayer(username, avatar, token)
      addProfile(player.username, avatar, player.id, token)
      // El lobby muestra el código una vez para que un adulto lo guarde
      if (player.recoveryCode) updateProfile(player.id, { recoveryCode: player.recoveryCode })
      navigate('/', { replace: true })
    } catch (err) {
      setChecking(false)
      if (err instanceof ApiError && err.code === 'username-taken') setError(TAKEN)
      else if (err instanceof NetworkError) setError('No pudimos conectar con el servidor. Inténtalo de nuevo en un momento.')
      else setError(err instanceof Error ? err.message : 'Algo salió mal. Inténtalo de nuevo.')
    }
  }

  return (
    <PageShell width="narrow">
      <form className="card register" onSubmit={handleSubmit} noValidate>
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
          maxLength={USERNAME_MAX}
          value={username}
          aria-invalid={error !== null}
          aria-describedby={error ? 'username-error' : undefined}
          onChange={(e) => {
            setUsername(e.target.value)
            setError(null)
          }}
        />
        <p id="username-error" className="field-error" role="alert">
          {error}
        </p>

        <fieldset className="avatar-picker">
          <legend className="field-label">¡Elige tu avatar!</legend>
          <div className="avatar-picker__grid" role="radiogroup">
            {AVATARS.map((a) => (
              <button
                key={a.id}
                type="button"
                role="radio"
                aria-checked={avatar === a.id}
                aria-label={a.name}
                className="choice avatar-picker__option"
                style={{ background: a.background }}
                onClick={() => setAvatar(a.id)}
              >
                <Avatar id={a.id} size={72} />
                {avatar === a.id && (
                  <span className="choice__check">
                    <Check />
                  </span>
                )}
              </button>
            ))}
          </div>
        </fieldset>

        <button type="submit" className="btn btn--primary btn--block" disabled={checking}>
          {checking ? 'Revisando…' : 'Crear perfil y jugar'}
          <ArrowRight />
        </button>
        <p className="register__note">No necesitas correo electrónico</p>
        <p className="register__recover">
          ¿Ya tienes un perfil? <Link to="/recuperar">Recupéralo con tu código secreto</Link>
        </p>
        {canGoBack && (
          <button type="button" className="btn btn--outline btn--small register__back" onClick={() => navigate('/')}>
            Volver
          </button>
        )}
      </form>
    </PageShell>
  )
}
