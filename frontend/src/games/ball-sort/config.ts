import { MAX_COLORS, MIN_COLORS } from '../../data/ballSort'

export interface BallSortConfig {
  colors: number
}

/** Lee la cantidad de colores de la URL; `null` si falta o está fuera del rango 1–10 */
export function parseBallSortConfig(params: URLSearchParams): BallSortConfig | null {
  const raw = params.get('colores')
  const colors = Number(raw)
  if (!raw || !Number.isInteger(colors) || colors < MIN_COLORS || colors > MAX_COLORS) return null
  return { colors }
}
