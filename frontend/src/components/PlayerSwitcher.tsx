import { useNavigate } from 'react-router'
import { usePlayerStore } from '../stores/playerStore'
import { levelFromXp } from '../utils/progression'
import { Avatar } from './Avatar'
import { Check, Plus } from './icons'

// Selector de jugador para dispositivos compartidos (sección 3.1)
export function PlayerSwitcher({ onDone }: { onDone: () => void }) {
  const { profiles, activeId, switchTo } = usePlayerStore()
  const navigate = useNavigate()

  return (
    <div className="switcher">
      <h2 id="switcher-title">¿Quién va a jugar?</h2>
      <ul className="switcher__list">
        {profiles.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              className="choice switcher__item"
              aria-pressed={p.id === activeId}
              onClick={() => {
                switchTo(p.id)
                onDone()
              }}
            >
              <Avatar id={p.avatar} look={p.bitbot} size={52} />
              <span>
                {p.username}
                <span className="choice__sub">Nivel {levelFromXp(p.xp).level}</span>
              </span>
              {p.id === activeId && (
                <span className="choice__check">
                  <Check />
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="btn btn--soft btn--block"
        onClick={() => {
          onDone()
          navigate('/registro?nuevo=1')
        }}
      >
        <Plus />
        Crear otro jugador
      </button>
    </div>
  )
}
