import { useEffect, useState } from 'react'
import type { Stopwatch } from '../utils/stopwatch'
import { formatDuration } from '../utils/format'

// Se actualiza por su cuenta para no volver a dibujar el tablero en cada tic
export function GameTimer({ stopwatch }: { stopwatch: Stopwatch }) {
  const [elapsed, setElapsed] = useState(() => stopwatch.elapsed())

  useEffect(() => {
    const id = window.setInterval(() => setElapsed(stopwatch.elapsed()), 250)
    return () => window.clearInterval(id)
  }, [stopwatch])

  return (
    <span className="pill pill--blue game-timer">
      <span aria-hidden>⏱</span> <span className="visually-hidden">Tiempo: </span>
      {formatDuration(elapsed)}
    </span>
  )
}
