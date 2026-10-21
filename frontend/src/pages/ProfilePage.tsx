import { Link } from 'react-router'
import { Avatar } from '../components/Avatar'
import { BackButton } from '../components/BackButton'
import { ArrowRight } from '../components/icons'
import { PageShell } from '../components/PageShell'
import { ProgressBar } from '../components/ProgressBar'
import { RecoverySection } from '../components/RecoverySection'
import { ACHIEVEMENTS } from '../data/achievements'
import { useActivePlayer } from '../stores/playerStore'
import { formatNumber } from '../utils/format'
import { levelFromXp } from '../utils/progression'

function encouragement(percent: number): string {
  if (percent >= 75) return '¡Ya casi subes de nivel!'
  if (percent >= 25) return '¡Vas por buen camino!'
  return '¡Cada partida te acerca al siguiente nivel!'
}

export function ProfilePage() {
  const player = useActivePlayer()!
  const { level, current, required } = levelFromXp(player.xp)

  return (
    <PageShell actions={<BackButton />}>
      <section className="card profile-card" aria-labelledby="profile-name">
        <Avatar id={player.avatar} look={player.bitbot} size={150} />
        <div className="profile-card__main">
          <span className="eyebrow">Tu perfil</span>
          <h1 id="profile-name">{player.username}</h1>
          <span className="pill pill--blue">Nivel {level}</span>
          <p className="profile-card__cheer">{encouragement((current / required) * 100)}</p>
          <ProgressBar value={current} max={required} label="Experiencia para el siguiente nivel" />
          <p className="profile-card__hint">
            {current} / {required} XP para el siguiente nivel
          </p>
        </div>
        <div className="profile-card__stats">
          <div className="profile-stat profile-stat--xp">
            <span aria-hidden>✦</span>
            <strong>{formatNumber(player.xp)} XP</strong>
            <span>Experiencia acumulada</span>
          </div>
          <div className="profile-stat profile-stat--bits">
            <span aria-hidden>B</span>
            <strong>{formatNumber(player.bits)} Bits</strong>
            <span>Tu saldo actual</span>
            <Link to="/taller" className="btn btn--outline btn--small profile-stat__link">
              Taller de BitBot
            </Link>
          </div>
        </div>
      </section>

      <section className="achievements" aria-labelledby="achievements-title">
        <div className="achievements__head">
          <div>
            <h2 id="achievements-title">Mis logros</h2>
            <p>Celebra lo que has conseguido y descubre tus próximos retos</p>
          </div>
          <Link to="/historial" className="btn btn--primary btn--small">
            Ver mi historial
            <ArrowRight />
          </Link>
        </div>
        <ul className="achievements__grid">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = player.achievements.includes(a.id)
            return (
              <li key={a.id} className={`achievement card ${unlocked ? '' : 'achievement--locked'}`}>
                <span className="achievement__icon" style={{ background: a.background }} aria-hidden>
                  {a.icon}
                </span>
                <span>
                  <strong>{a.name}</strong>
                  <span className="achievement__status">{unlocked ? 'Logro desbloqueado' : a.description}</span>
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      <RecoverySection player={player} />
    </PageShell>
  )
}
