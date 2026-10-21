import type { GameRecord } from '../types'

export interface GameStat {
  label: string
  value: string | number
}

/** Lo que un minijuego informa al terminar la partida */
export interface GameOutcome {
  result: GameRecord['result']
  /** Texto breve para el historial */
  summary: string
  /** Estadísticas que se muestran en la pantalla de resultados */
  stats: GameStat[]
  /** Datos específicos del juego que se registran (secciones 5.7, 6.6, 7.7 y 8.7) */
  details: Record<string, unknown>
  /** Mensaje adicional en los resultados, por ejemplo quién ganó */
  message?: string
}

export interface GameProps<Config> {
  config: Config
  /** Verdadero mientras el menú de pausa está abierto */
  paused: boolean
  /** Se llama una sola vez, cuando termina la partida */
  onFinish: (outcome: GameOutcome) => void
}
