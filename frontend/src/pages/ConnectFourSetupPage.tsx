import { useState } from 'react'
import { useNavigate } from 'react-router'
import { BackButton } from '../components/BackButton'
import { ArrowRight, User, Users } from '../components/icons'
import { PageShell } from '../components/PageShell'
import type { AiDifficulty } from '../games/connect-four/ai'
import { AI_DIFFICULTY_NAMES, connectFourPath } from '../games/connect-four/config'

const DIFFICULTIES: { id: AiDifficulty; description: string; color: string }[] = [
  { id: 'easy', description: 'BitBot aún está aprendiendo', color: 'var(--mint)' },
  { id: 'normal', description: 'Gana y bloquea cuando puede', color: 'var(--blue)' },
  { id: 'hard', description: 'Piensa varias jugadas adelante', color: 'var(--orange)' },
]

// Modo de juego y dificultad de la IA (sección 5.2)
export function ConnectFourSetupPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'ai' | 'local'>('ai')
  const [difficulty, setDifficulty] = useState<AiDifficulty>('normal')

  function start() {
    navigate(connectFourPath(mode === 'ai' ? { mode, difficulty } : { mode }))
  }

  return (
    <PageShell actions={<BackButton />} width="medium">
      <div className="page-title">
        <h1>¡Preparemos Conecta 4!</h1>
        <p>Elige contra quién quieres jugar</p>
      </div>

      <div className="card setup">
        <h2 className="section-heading">
          <span className="step-badge">1</span>
          Modo de juego
        </h2>
        <div className="game-tabs">
          <button type="button" className="choice game-tab" aria-pressed={mode === 'ai'} onClick={() => setMode('ai')}>
            <span className="mode-icon" aria-hidden>
              <User />
            </span>
            <span>
              Contra BitBot
              <span className="choice__sub">Juega contra la computadora</span>
            </span>
          </button>
          <button
            type="button"
            className="choice game-tab"
            aria-pressed={mode === 'local'}
            onClick={() => setMode('local')}
          >
            <span className="mode-icon" aria-hidden>
              <Users />
            </span>
            <span>
              Dos jugadores
              <span className="choice__sub">Por turnos en este dispositivo</span>
            </span>
          </button>
        </div>

        {mode === 'ai' && (
          <>
            <h2 className="section-heading">
              <span className="step-badge">2</span>
              Dificultad de BitBot
            </h2>
            <div className="difficulty-grid">
              {DIFFICULTIES.map((d, i) => (
                <button
                  key={d.id}
                  type="button"
                  className="choice"
                  aria-pressed={difficulty === d.id}
                  onClick={() => setDifficulty(d.id)}
                >
                  <span
                    className="difficulty-number"
                    style={{ background: d.color, color: d.color === 'var(--blue)' ? '#fff' : undefined }}
                  >
                    {i + 1}
                  </span>
                  <span>
                    {AI_DIFFICULTY_NAMES[d.id]}
                    <span className="choice__sub">{d.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="setup__footer">
          <button type="button" className="btn btn--primary setup__start" onClick={start}>
            ¡Comenzar partida!
            <ArrowRight />
          </button>
          <p>Conecta cuatro fichas en línea para ganar</p>
        </div>
      </div>
    </PageShell>
  )
}
