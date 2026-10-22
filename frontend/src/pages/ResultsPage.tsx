import type { CSSProperties } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { Restart } from '../components/icons'
import { PageShell } from '../components/PageShell'
import { PixelGlyph } from '../components/PixelGlyph'
import { PixelSprite } from '../components/PixelSprite'
import { StatCard } from '../components/StatCard'
import { GAMES } from '../data/games'
import type { GameStat } from '../games/types'
import { useBitBotSprite } from '../hooks/useBitBotSprite'
import type { GameId } from '../types'
import { formatDuration } from '../utils/format'

export interface ResultsState {
  game: GameId
  /** Ruta para jugar de nuevo con la misma configuración */
  replayPath: string
  outcome: 'win' | 'loss' | 'draw' | 'completed'
  durationMs: number
  /** Estadísticas propias del juego */
  stats: GameStat[]
  /** Mensaje adicional, por ejemplo quién ganó */
  message?: string
  xp: number
  bits: number
  /** Nuevo nivel, si la partida hizo subir de nivel */
  levelUp?: number
  /** Nombres de los logros desbloqueados con esta partida */
  achievements: string[]
}

const HEADLINES: Record<ResultsState['outcome'], { title: string; cheer: string }> = {
  win: { title: '¡VICTORIA!', cheer: '¡Lo hiciste genial!' },
  completed: { title: '¡COMPLETADO!', cheer: '¡Excelente trabajo!' },
  draw: { title: '¡EMPATE!', cheer: '¡Qué partida tan reñida!' },
  loss: { title: '¡Casi lo logras!', cheer: '¡La próxima vez será!' },
}

const STAT_COLORS = ['var(--lilac)', 'var(--mint)', 'var(--orange)']
const CONFETTI_COLORS = ['var(--blue)', 'var(--mint)', 'var(--yellow)', 'var(--orange)', 'var(--lilac)']

/** Lluvia de píxeles para celebrar; desaparece con "Reducir animaciones" */
function Confetti() {
  return (
    <div className="confetti" aria-hidden>
      {Array.from({ length: 24 }, (_, i) => (
        <span
          key={i}
          style={
            {
              '--x': `${(i * 37) % 100}%`,
              '--delay': `${(i % 8) * 120}ms`,
              '--color': CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}

export function ResultsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const result = location.state as ResultsState | null
  const bitbot = useBitBotSprite()
  if (!result) return <Navigate to="/" replace />

  const headline = HEADLINES[result.outcome]
  const game = GAMES[result.game]

  return (
    <PageShell width="medium">
      {(result.outcome === 'win' || result.outcome === 'completed') && <Confetti />}
      <section className="results-hero">
        <div>
          <span className="eyebrow">Partida terminada · {game.name}</span>
          <h1>{headline.title}</h1>
          <p className="results-hero__cheer">{headline.cheer}</p>
          {result.message && <p className="results-hero__message">{result.message}</p>}
        </div>
        <span className="results-hero__mascot" aria-hidden>
          <PixelSprite sprite={bitbot} size={96} />
        </span>
      </section>

      <h2 className="results-subtitle">Resumen de la partida</h2>
      <div className="stats-row">
        <StatCard value={formatDuration(result.durationMs)} label="Tiempo total" color="var(--blue)" />
        {result.stats.map((stat, i) => (
          <StatCard key={stat.label} value={stat.value} label={stat.label} color={STAT_COLORS[i % STAT_COLORS.length]} />
        ))}
      </div>

      <section className="card rewards" aria-labelledby="rewards-title">
        <h2 id="rewards-title">¡Tus recompensas!</h2>
        <div className="rewards__grid">
          <div className="reward reward--xp">
            <span className="reward__icon" aria-hidden>
              <PixelGlyph name="star" />
            </span>
            <span>
              <strong>+{result.xp} XP</strong>
              <span>Experiencia ganada</span>
            </span>
          </div>
          {result.bits > 0 && (
            <div className="reward reward--bits">
              <span className="reward__icon" aria-hidden>
                B
              </span>
              <span>
                <strong>+{result.bits} Bits</strong>
                <span>Bits obtenidos</span>
              </span>
            </div>
          )}
          {result.levelUp !== undefined && (
            <div className="reward reward--level">
              <span className="reward__icon" aria-hidden>
                <PixelGlyph name="triangle" />
              </span>
              <span>
                <strong>¡Nivel {result.levelUp}!</strong>
                <span>Subiste de nivel</span>
              </span>
            </div>
          )}
          {(result.achievements ?? []).map((name) => (
            <div key={name} className="reward reward--achievement">
              <span className="reward__icon" aria-hidden>
                <PixelGlyph name="diamond" />
              </span>
              <span>
                <strong>¡{name}!</strong>
                <span>Nuevo logro desbloqueado</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="results-actions">
        <button type="button" className="btn btn--primary" onClick={() => navigate(result.replayPath, { replace: true })}>
          <Restart />
          Reiniciar partida
        </button>
        <button type="button" className="btn btn--success" onClick={() => navigate('/')}>
          Salir al lobby
        </button>
      </div>
      <p className="results-note">¡Cada partida es una nueva oportunidad para aprender!</p>
    </PageShell>
  )
}
