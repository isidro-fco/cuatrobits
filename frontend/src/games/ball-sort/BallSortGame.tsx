import { useState } from 'react'
import { SPHERE_NAMES, SPHERE_SYMBOLS } from '../../data/ballSort'
import { Restart, Shuffle } from '../../components/icons'
import { PixelGlyph } from '../../components/PixelGlyph'
import { PixelSphere } from '../../components/PixelSphere'
import { playSfx } from '../../services/audio'
import type { GameProps } from '../types'
import type { BallSortConfig } from './config'
import { canMove, CAPACITY, completedTubes, generateLevel, isSolved, moveBall, type Tubes } from './logic'

export function BallSortGame({ config, onFinish }: GameProps<BallSortConfig>) {
  const [initial, setInitial] = useState(() => generateLevel(config.colors))
  const [tubes, setTubes] = useState<Tubes>(initial)
  const [history, setHistory] = useState<Tubes[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [rejected, setRejected] = useState<{ tube: number; n: number } | null>(null)
  const [lastTarget, setLastTarget] = useState<number | null>(null)
  const solved = isSolved(tubes)

  function reject(tube: number) {
    playSfx('invalid')
    setRejected((r) => ({ tube, n: (r?.n ?? 0) + 1 }))
  }

  function selectTube(index: number) {
    if (solved) return
    if (selected === null) {
      if (tubes[index].length === 0) reject(index)
      else {
        setSelected(index)
        playSfx('select')
      }
      return
    }
    if (selected === index) {
      setSelected(null)
      return
    }
    if (!canMove(tubes, selected, index)) {
      reject(index)
      setSelected(null)
      return
    }

    const next = moveBall(tubes, selected, index)
    const moves = history.length + 1
    setHistory([...history, tubes])
    setTubes(next)
    setSelected(null)
    setLastTarget(index)
    playSfx('drop')
    if (isSolved(next)) {
      onFinish({
        result: 'completed',
        summary: `${config.colors} ${config.colors === 1 ? 'color' : 'colores'} · ${moves} movimientos`,
        stats: [
          { label: 'Movimientos', value: moves },
          { label: 'Colores', value: config.colors },
        ],
        message: '¡Todas las esferas están ordenadas!',
        details: { colors: config.colors, moves, completed: true },
      })
    }
  }

  function undo() {
    if (history.length === 0 || solved) return
    setTubes(history[history.length - 1])
    setHistory(history.slice(0, -1))
    setSelected(null)
    playSfx('select')
    setLastTarget(null)
  }

  function restartLevel(level: Tubes = initial) {
    setTubes(level)
    setHistory([])
    setSelected(null)
    setLastTarget(null)
  }

  /** Otro nivel con los mismos colores, también con solución verificada */
  function newLevel() {
    const level = generateLevel(config.colors)
    setInitial(level)
    restartLevel(level)
    playSfx('select')
  }

  return (
    <div className="ball-sort">
      <div className="game-toolbar">
        <span className="pill pill--blue">Movimientos: {history.length}</span>
        <span className="pill pill--mint">
          Tubos completos: {completedTubes(tubes)} / {config.colors}
        </span>
        <span className="game-toolbar__spacer" />
        <div className="ball-sort__actions">
          <button type="button" className="btn btn--outline btn--small" onClick={undo} disabled={history.length === 0 || solved}>
            <PixelGlyph name="undo" />
            Deshacer
          </button>
          <button type="button" className="btn btn--outline btn--small" onClick={() => restartLevel()} disabled={solved}>
            <Restart />
            Reiniciar nivel
          </button>
          <button type="button" className="btn btn--outline btn--small" onClick={newLevel} disabled={solved}>
            <Shuffle />
            Nuevas esferas
          </button>
        </div>
      </div>

      <p className="game-status" role="status">
        {solved
          ? '¡Nivel completado!'
          : selected === null
            ? 'Toca un tubo para tomar la esfera de arriba'
            : `Tomaste una esfera ${SPHERE_NAMES[tubes[selected].at(-1)!]}. Ahora toca otro tubo.`}
      </p>

      <div className="ball-sort__tubes" data-solved={solved}>
        {tubes.map((tube, t) => {
          const full = tube.length === CAPACITY && tube.every((c) => c === tube[0])
          return (
            <button
              key={t}
              type="button"
              className="tube tube--game"
              data-selected={selected === t}
              data-complete={full}
              aria-pressed={selected === t}
              aria-label={`Tubo ${t + 1}: ${tube.length === 0 ? 'vacío' : tube.map((c) => SPHERE_NAMES[c]).join(', ')}`}
              onClick={() => selectTube(t)}
            >
              {/* La clave cambia con cada rechazo para reiniciar la animación */}
              <span key={rejected?.tube === t ? rejected.n : 0} className={rejected?.tube === t ? 'tube__inner is-rejected' : 'tube__inner'}>
                {tube.map((color, i) => {
                  const isTop = i === tube.length - 1
                  return (
                    <span
                      key={i}
                      className={`ball ${isTop && selected === t ? 'is-lifted' : ''} ${isTop && lastTarget === t ? 'is-dropped' : ''}`}
                      aria-hidden
                    >
                      <PixelSphere color={color} />
                      <PixelGlyph name={SPHERE_SYMBOLS[color]} className="ball__symbol" />
                    </span>
                  )
                })}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
