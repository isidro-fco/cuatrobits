import { useNavigate } from 'react-router'
import { Home, Pause, Play, Restart } from './icons'
import { PixelSprite } from './PixelSprite'
import { useBitBotSprite } from '../hooks/useBitBotSprite'
import { SettingsPanel } from './SettingsPanel'

interface PauseMenuProps {
  onResume: () => void
  onRestart: () => void
}

export function PauseMenu({ onResume, onRestart }: PauseMenuProps) {
  const navigate = useNavigate()
  const bitbot = useBitBotSprite()
  return (
    <div className="pause">
      <header className="pause__head">
        <span className="pause__icon" aria-hidden>
          <Pause />
        </span>
        <div>
          <h2 id="pause-title">¡Juego en pausa!</h2>
          <p>Tómate un descanso o ajusta tus preferencias.</p>
        </div>
      </header>
      <div className="pause__body">
        <div className="pause__actions">
          <button type="button" className="btn btn--primary btn--block" onClick={onResume} autoFocus>
            <Play />
            Continuar jugando
          </button>
          <button type="button" className="btn btn--soft btn--block" onClick={onRestart}>
            <Restart />
            Reiniciar partida
          </button>
          <button type="button" className="btn btn--outline btn--block" onClick={() => navigate('/')}>
            <Home />
            Salir al lobby
          </button>
          <div className="pause__mascot">
            <span>
              <PixelSprite sprite={bitbot} size={64} />
            </span>
            ¡Te espero!
          </div>
        </div>
        <SettingsPanel />
      </div>
    </div>
  )
}
