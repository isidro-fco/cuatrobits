import { useState, type CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router'
import { Avatar } from '../components/Avatar'
import { IslandArt } from '../components/IslandArt'
import { Gear, User, Users } from '../components/icons'
import { Modal } from '../components/Modal'
import { PageShell } from '../components/PageShell'
import { PlayerSwitcher } from '../components/PlayerSwitcher'
import { RecoveryCode } from '../components/RecoveryCode'
import { ProgressBar } from '../components/ProgressBar'
import { SettingsPanel } from '../components/SettingsPanel'
import { GAME_ORDER, GAMES } from '../data/games'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { playSfx } from '../services/audio'
import { useActivePlayer, usePlayerStore } from '../stores/playerStore'
import type { GameId, Player } from '../types'
import { formatNumber } from '../utils/format'
import { levelFromXp } from '../utils/progression'

const TRANSITION_MS = 450

function PlayerBadge({ player }: { player: Player }) {
  const { level, current, required } = levelFromXp(player.xp)
  return (
    <div className="player-badge card">
      <Avatar id={player.avatar} look={player.bitbot} size={52} />
      <div className="player-badge__info">
        <strong>{player.username}</strong>
        <span>
          Nivel {level} · {current} / {required} XP
        </span>
      </div>
      <div className="player-badge__bar">
        <ProgressBar value={current} max={required} label="Experiencia para el siguiente nivel" />
      </div>
    </div>
  )
}

export function LobbyPage() {
  const player = useActivePlayer()!
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()
  const [leaving, setLeaving] = useState<GameId | null>(null)
  const [dialog, setDialog] = useState<'settings' | 'switcher' | null>(null)
  const updateProfile = usePlayerStore((s) => s.updateProfile)
  const showCode = player.recoveryCode !== undefined && !player.recoveryCodeSeen

  function openGame(game: GameId) {
    if (leaving) return
    playSfx('select')
    const path = GAMES[game].entryPath
    if (reducedMotion) {
      navigate(path)
      return
    }
    setLeaving(game)
    window.setTimeout(() => navigate(path), TRANSITION_MS)
  }

  return (
    <PageShell
      actions={
        <>
          <PlayerBadge player={player} />
          <Link to="/taller" className="bits-badge bits-badge--link" aria-label={`${player.bits} Bits. Abrir el taller de BitBot`}>
            <span className="bits-badge__coin" aria-hidden>
              B
            </span>
            {formatNumber(player.bits)} Bits
          </Link>
          <Link to="/perfil" className="btn btn--outline btn--small">
            <User />
            Perfil
          </Link>
          <button type="button" className="btn btn--outline btn--small" onClick={() => setDialog('settings')}>
            <Gear />
            Configuración
          </button>
          <button type="button" className="btn btn--outline btn--small" onClick={() => setDialog('switcher')}>
            <Users />
            Cambiar jugador
          </button>
        </>
      }
    >
      <div className="page-title">
        <h1>¡Elige un minijuego!</h1>
        <p>Explora las islas y diviértete aprendiendo</p>
      </div>

      <nav aria-label="Minijuegos" className={`islands ${leaving ? 'islands--leaving' : ''}`}>
        {GAME_ORDER.map((id) => {
          const game = GAMES[id]
          return (
            <button
              key={id}
              type="button"
              className={`island ${leaving === id ? 'island--selected' : ''}`}
              style={{ '--island': game.islandColor, '--label': game.color } as CSSProperties}
              onClick={() => openGame(id)}
              disabled={leaving !== null && leaving !== id}
            >
              <IslandArt game={id} />
              <span className="island__platform" aria-hidden>
                <span className="island__top" />
                <span className="island__soil" />
              </span>
              <span className="island__label">{game.name}</span>
            </button>
          )
        })}
      </nav>

      <Modal open={dialog === 'settings'} onClose={() => setDialog(null)} labelledBy="settings-title">
        <SettingsPanel />
        <button type="button" className="btn btn--primary btn--block modal__close" onClick={() => setDialog(null)}>
          Listo
        </button>
      </Modal>
      <Modal
        open={showCode && dialog === null}
        onClose={() => updateProfile(player.id, { recoveryCodeSeen: true })}
        labelledBy="code-title"
      >
        <div className="code-notice">
          <h2 id="code-title">¡Guarda tu código secreto!</h2>
          <p>Pídele a un adulto que lo anote. Con tu nombre y este código puedes recuperar tu perfil en otro dispositivo.</p>
          <RecoveryCode code={player.recoveryCode ?? ''} />
          <p className="code-notice__hint">También lo encuentras en tu perfil.</p>
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={() => updateProfile(player.id, { recoveryCodeSeen: true })}
          >
            Ya lo guardé
          </button>
        </div>
      </Modal>
      <Modal open={dialog === 'switcher'} onClose={() => setDialog(null)} labelledBy="switcher-title">
        <PlayerSwitcher onDone={() => setDialog(null)} />
      </Modal>
    </PageShell>
  )
}
