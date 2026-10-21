import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { BackButton } from '../components/BackButton'
import { ArrowRight, Check } from '../components/icons'
import { PageShell } from '../components/PageShell'
import { PixelSprite } from '../components/PixelSprite'
import { BITBOT_DIFFICULTIES, CATEGORIES, MEMORY_DIFFICULTIES } from '../data/categories'
import { useBitBotSprite } from '../hooks/useBitBotSprite'
import type { CategoryId } from '../types'

type SetupGame = 'bitbot' | 'memory'

function isSetupGame(value: string | undefined): value is SetupGame {
  return value === 'bitbot' || value === 'memory'
}

// Selección de categoría y dificultad para Arma a BitBot y Memorama (sección 11)
export function GameSetupPage() {
  const params = useParams()
  if (!isSetupGame(params.game)) return <Navigate to="/" replace />
  return <GameSetup key={params.game} game={params.game} />
}

function GameSetup({ game }: { game: SetupGame }) {
  const navigate = useNavigate()
  const bitbot = useBitBotSprite()
  const difficulties =game === 'bitbot' ? BITBOT_DIFFICULTIES : MEMORY_DIFFICULTIES
  const [difficulty, setDifficulty] = useState<string>(difficulties[0].id)
  const [category, setCategory] = useState<CategoryId | null>(null)

  // En BitBot cada dificultad tiene sus propias categorías (sección 6.2)
  const isCategoryEnabled = (c: (typeof CATEGORIES)[number]) => game === 'memory' || c.bitbotDifficulty === difficulty

  function chooseDifficulty(id: string) {
    setDifficulty(id)
    if (game === 'bitbot' && category && CATEGORIES.find((c) => c.id === category)?.bitbotDifficulty !== id) {
      setCategory(null)
    }
  }

  function start() {
    if (!category) return
    navigate(`/juego/${game}?categoria=${category}&dificultad=${difficulty}`)
  }

  const difficultyStep = (
    <>
      <h2 className="section-heading">
        <span className="step-badge">{game === 'bitbot' ? 1 : 2}</span>
        Elige la dificultad
      </h2>
      <div className={`difficulty-grid difficulty-grid--${difficulties.length}`}>
        {difficulties.map((d, i) => (
          <button
            key={d.id}
            type="button"
            className="choice"
            aria-pressed={difficulty === d.id}
            onClick={() => chooseDifficulty(d.id)}
          >
            <span
              className="difficulty-number"
              style={{ background: d.color, color: d.color === 'var(--blue)' ? '#fff' : undefined }}
            >
              {i + 1}
            </span>
            <span>
              {d.name}
              <span className="choice__sub">{d.description}</span>
            </span>
          </button>
        ))}
      </div>
    </>
  )

  const categoryStep = (
    <>
      <h2 className="section-heading">
        <span className="step-badge">{game === 'bitbot' ? 2 : 1}</span>
        Elige una categoría
      </h2>
      <div className="category-grid">
        {CATEGORIES.map((c) => {
          const enabled = isCategoryEnabled(c)
          return (
            <button
              key={c.id}
              type="button"
              className="choice"
              style={{ background: category === c.id ? undefined : c.background }}
              aria-pressed={category === c.id}
              disabled={!enabled}
              onClick={() => setCategory(c.id)}
            >
              <span className="category-emoji" aria-hidden>
                {c.emoji}
              </span>
              {c.name}
              {category === c.id && (
                <span className="choice__check">
                  <Check />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </>
  )

  return (
    <PageShell actions={<BackButton />} width="medium">
      <div className="page-title">
        <h1>¡Preparemos tu partida!</h1>
        <p>Escoge una categoría y elige tu desafío</p>
      </div>

      <div className="card setup">
        <div className="game-tabs" role="tablist" aria-label="Juego">
          <button
            type="button"
            role="tab"
            aria-selected={game === 'bitbot'}
            className="choice game-tab"
            onClick={() => navigate('/preparar/bitbot', { replace: true })}
          >
            <PixelSprite sprite={bitbot} size={48} />
            <span>
              Arma a BitBot
              <span className="choice__sub">Construye y descubre palabras</span>
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={game === 'memory'}
            className="choice game-tab"
            onClick={() => navigate('/preparar/memory', { replace: true })}
          >
            <span className="memory-icon" aria-hidden>
              <i />
              <i />
              <i />
              <i />
            </span>
            <span>
              Memorama
              <span className="choice__sub">Encuentra todas las parejas</span>
            </span>
          </button>
        </div>

        {game === 'bitbot' ? (
          <>
            {difficultyStep}
            {categoryStep}
          </>
        ) : (
          <>
            {categoryStep}
            {difficultyStep}
          </>
        )}

        <div className="setup__footer">
          <button type="button" className="btn btn--primary setup__start" disabled={!category} onClick={start}>
            ¡Comenzar partida!
            <ArrowRight />
          </button>
          <p>{category ? '¡Tu próxima aventura comienza aquí!' : 'Elige una categoría para comenzar'}</p>
        </div>
      </div>
    </PageShell>
  )
}
