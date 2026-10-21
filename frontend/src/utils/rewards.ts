// Experiencia y Bits por partida (secciones 9.1 y 9.4). Los valores se pueden ajustar aquí;
// deben coincidir con backend/src/models/rules.ts.
import type { GameId, GameRecord } from '../types'

export const XP_COMPLETE = 10

/** Bono por ganar o completar cada juego */
export const XP_BONUS: Record<GameId, number> = {
  'connect-four': 15,
  bitbot: 10,
  'ball-sort': 15,
  memory: 10,
}

/** Nunca resta experiencia: perder o empatar otorga la XP base */
export function xpForGame(game: GameId, result: GameRecord['result']): number {
  const success = result === 'win' || result === 'completed'
  return XP_COMPLETE + (success ? XP_BONUS[game] : 0)
}

/** Bits por terminar una partida y bono por ganarla o completarla */
export const BITS_COMPLETE = 2
export const BITS_SUCCESS = 3

export function bitsForGame(result: GameRecord['result']): number {
  const success = result === 'win' || result === 'completed'
  return BITS_COMPLETE + (success ? BITS_SUCCESS : 0)
}
