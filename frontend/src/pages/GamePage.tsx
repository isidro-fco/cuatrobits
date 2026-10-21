import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { GameTimer } from '../components/GameTimer'
import { ArrowRight, Home, Pause } from '../components/icons'
import { Modal } from '../components/Modal'
import { PageShell } from '../components/PageShell'
import { PauseMenu } from '../components/PauseMenu'
import { GAMES, isGameId } from '../data/games'
import { BallSortGame } from '../games/ball-sort/BallSortGame'
import { parseBallSortConfig } from '../games/ball-sort/config'
import { BitBotGame } from '../games/bitbot/BitBotGame'
import { parseBitBotConfig } from '../games/bitbot/config'
import { parseConnectFourConfig } from '../games/connect-four/config'
import { ConnectFourGame } from '../games/connect-four/ConnectFourGame'
import { parseMemoryConfig } from '../games/memory/config'
import { MemoryGame } from '../games/memory/MemoryGame'
import type { GameOutcome } from '../games/types'
import { checkAchievements } from '../services/achievementService'
import { playSfx, type SfxName } from '../services/audio'
import { useHistoryStore } from '../stores/historyStore'
import { useActivePlayer, usePlayerStore } from '../stores/playerStore'
import { useSettingsStore } from '../stores/settingsStore'
import type { GameId, GameRecord } from '../types'
import { levelFromXp } from '../utils/progression'
import { bitsForGame, xpForGame } from '../utils/rewards'
import { Stopwatch } from '../utils/stopwatch'
import type { ResultsState } from './ResultsPage'

interface BoardProps {
  paused: boolean
  onFinish: (outcome: GameOutcome) => void
}

/** Tablero del juego con la configuración de la URL, o `null` si no es válida */
function renderBoard(game: GameId, params: URLSearchParams, props: BoardProps): ReactNode | null {
  switch (game) {
    case 'connect-four': {
      const config = parseConnectFourConfig(params)
      return config && <ConnectFourGame config={config} {...props} />
    }
    case 'bitbot': {
      const config = parseBitBotConfig(params)
      return config && <BitBotGame config={config} {...props} />
    }
    case 'ball-sort': {
      const config = parseBallSortConfig(params)
      return config && <BallSortGame config={config} {...props} />
    }
    case 'memory': {
      const config = parseMemoryConfig(params)
      return config && <MemoryGame config={config} {...props} />
    }
  }
}

const OUTCOME_SOUNDS: Record<GameRecord['result'], SfxName> = {
  win: 'win',
  completed: 'win',
  draw: 'draw',
  loss: 'lose',
}

function createRecord(
  playerId: string,
  game: GameId,
  outcome: GameOutcome,
  durationMs: number,
  rewards: { xp: number; bits: number },
): GameRecord {
  return {
    id: crypto.randomUUID(),
    playerId,
    game,
    result: outcome.result,
    durationMs,
    xpEarned: rewards.xp,
    bitsEarned: rewards.bits,
    summary: outcome.summary,
    details: outcome.details,
    playedAt: new Date().toISOString(),
    syncStatus: 'pending',
  }
}

export function GamePage() {
  const { gameId } = useParams()
  if (!isGameId(gameId)) return <Navigate to="/" replace />
  return <GameScreen key={gameId} game={gameId} />
}

function GameScreen({ game }: { game: GameId }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const player = useActivePlayer()!
  const addRecord = useHistoryStore((s) => s.addRecord)
  const addRewards = usePlayerStore((s) => s.addRewards)
  const showTimer = useSettingsStore((s) => s.showTimer)

  const [paused, setPaused] = useState(false)
  // Cambiar la clave vuelve a montar la partida con un estado nuevo, sin temporizadores previos
  const [round, setRound] = useState(0)
  const [stopwatch, setStopwatch] = useState(() => new Stopwatch())
  const [finished, setFinished] = useState<ResultsState | null>(null)

  useEffect(() => {
    if (paused || finished) stopwatch.pause()
    else stopwatch.start()
  }, [paused, finished, stopwatch])

  function handleFinish(outcome: GameOutcome) {
    stopwatch.pause()
    const durationMs = Math.round(stopwatch.elapsed())
    const rewards = { xp: xpForGame(game, outcome.result), bits: bitsForGame(outcome.result) }
    addRecord(createRecord(player.id, game, outcome, durationMs, rewards))
    addRewards(player.id, rewards)
    const levelBefore = levelFromXp(player.xp).level
    const levelAfter = levelFromXp(player.xp + rewards.xp).level
    const achievements = checkAchievements(player.id)

    playSfx(OUTCOME_SOUNDS[outcome.result])
    if (levelAfter > levelBefore) playSfx('levelUp', 900)
    if (achievements.length > 0) playSfx('unlock', levelAfter > levelBefore ? 1700 : 900)

    setFinished({
      game,
      replayPath: location.pathname + location.search,
      outcome: outcome.result,
      durationMs,
      stats: outcome.stats,
      message: outcome.message,
      xp: rewards.xp,
      bits: rewards.bits,
      levelUp: levelAfter > levelBefore ? levelAfter : undefined,
      achievements: achievements.map((a) => a.name),
    })
  }

  function restart() {
    setRound((r) => r + 1)
    setStopwatch(new Stopwatch())
    setFinished(null)
    setPaused(false)
  }

  const board = renderBoard(game, params, { paused, onFinish: handleFinish })
  if (board === null) return <Navigate to={GAMES[game].entryPath} replace />
  const info = GAMES[game]

  return (
    <PageShell
      actions={
        <>
          {showTimer && <GameTimer stopwatch={stopwatch} />}
          <button
            type="button"
            className="btn btn--outline btn--small"
            onClick={() => setPaused(true)}
            disabled={finished !== null}
          >
            <Pause />
            Pausa
          </button>
          <button type="button" className="btn btn--outline btn--small" onClick={() => navigate('/')}>
            <Home />
            Salir al lobby
          </button>
        </>
      }
      width="medium"
    >
      <div className="page-title page-title--compact">
        <h1>{info.name}</h1>
        <p>{info.tagline}</p>
      </div>

      {finished && (
        <div className="finish-banner card" role="alert">
          <p>
            <strong>{finished.message ?? '¡Partida terminada!'}</strong>
          </p>
          <button
            type="button"
            className="btn btn--primary"
            autoFocus
            onClick={() => navigate('/resultados', { state: finished })}
          >
            Ver resultados
            <ArrowRight />
          </button>
        </div>
      )}

      <section key={round} className="card game-area" aria-label="Área de juego">
        {board}
      </section>

      <Modal open={paused} onClose={() => setPaused(false)} labelledBy="pause-title" size="large">
        <PauseMenu onResume={() => setPaused(false)} onRestart={restart} />
      </Modal>
    </PageShell>
  )
}
