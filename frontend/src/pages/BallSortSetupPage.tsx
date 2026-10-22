import { useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router'
import { BackButton } from '../components/BackButton'
import { ArrowRight } from '../components/icons'
import { PageShell } from '../components/PageShell'
import { PixelSphere } from '../components/PixelSphere'
import { MAX_COLORS, MIN_COLORS, SPHERE_COLORS, SPHERES_PER_COLOR, tubeCount } from '../data/ballSort'

export function BallSortSetupPage() {
  const navigate = useNavigate()
  const [colors, setColors] = useState(4)
  const tubes = tubeCount(colors)

  // Vista previa ilustrativa: el nivel real lo crea `generateLevel` al comenzar
  const preview = Array.from({ length: tubes }, (_, t) =>
    t < colors ? Array.from({ length: SPHERES_PER_COLOR }, (_, i) => (t + i * 3) % colors) : [],
  )

  return (
    <PageShell actions={<BackButton />} width="medium">
      <div className="page-title">
        <h1>¡Ordena las esferas!</h1>
        <p>Elige cuántos colores quieres organizar. ¡Tú decides el reto!</p>
      </div>

      <div className="card setup">
        <div className="sphere-setup__head">
          <div>
            <h2 className="sphere-setup__title">
              <label htmlFor="color-count">¿Cuántos colores quieres ordenar?</label>
            </h2>
            <p className="sphere-setup__sub">
              Selecciona una cantidad del {MIN_COLORS} al {MAX_COLORS}
            </p>
          </div>
          <output htmlFor="color-count" className="color-count">
            <strong>{colors}</strong>
            {colors === 1 ? 'color' : 'colores'}
          </output>
        </div>

        <input
          id="color-count"
          type="range"
          className="range"
          min={MIN_COLORS}
          max={MAX_COLORS}
          value={colors}
          onChange={(e) => setColors(Number(e.target.value))}
          style={{ '--fill': `${((colors - MIN_COLORS) / (MAX_COLORS - MIN_COLORS)) * 100}%` } as CSSProperties}
        />
        <div className="color-scale">
          {SPHERE_COLORS.map((color, i) => (
            <button
              key={color}
              type="button"
              className={`color-scale__item ${i < colors ? 'is-active' : ''}`}
              onClick={() => setColors(i + 1)}
              aria-label={`${i + 1} ${i === 0 ? 'color' : 'colores'}`}
            >
              <PixelSphere color={i} className="color-scale__sphere" />
              {i + 1}
            </button>
          ))}
        </div>

        <div className="sphere-setup__preview-head">
          <div>
            <h2 className="sphere-setup__title">Así será tu nivel</h2>
            <p className="sphere-setup__sub">Una vista previa de tu desafío</p>
          </div>
          <div className="sphere-setup__pills">
            <span className="pill pill--blue">{colors} {colors === 1 ? 'color' : 'colores'}</span>
            <span className="pill pill--mint">{tubes} tubos</span>
          </div>
        </div>
        <div className="tube-preview" aria-hidden>
          {preview.map((balls, t) => (
            <span key={t} className="tube">
              {balls.map((color, i) => (
                <span key={i} className="ball">
                  <PixelSphere color={color} />
                </span>
              ))}
            </span>
          ))}
        </div>

        <div className="setup__footer">
          <button
            type="button"
            className="btn btn--success setup__start"
            onClick={() => navigate(`/juego/ball-sort?colores=${colors}`)}
          >
            ¡Comenzar nivel!
            <ArrowRight />
          </button>
        </div>
      </div>
    </PageShell>
  )
}
