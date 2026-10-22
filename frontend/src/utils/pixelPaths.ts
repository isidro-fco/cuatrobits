/** Trazo SVG de todos los píxeles de un mismo color (letra de la fila) */
export interface PixelPath {
  char: string
  d: string
}

const cache = new WeakMap<readonly string[], PixelPath[]>()

/**
 * Convierte las filas de un sprite en un trazo por color. Los píxeles seguidos de cada fila se unen
 * en un solo rectángulo, así un sprite queda en unos pocos elementos en lugar de cientos.
 */
export function pixelPaths(rows: readonly string[]): PixelPath[] {
  const cached = cache.get(rows)
  if (cached) return cached
  const byChar = new Map<string, string[]>()
  rows.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const char = row[x]
      let end = x + 1
      while (end < row.length && row[end] === char) end++
      if (char !== '.') {
        const parts = byChar.get(char) ?? []
        parts.push(`M${x} ${y}h${end - x}v1h${x - end}z`)
        byChar.set(char, parts)
      }
      x = end
    }
  })
  const paths = [...byChar].map(([char, parts]) => ({ char, d: parts.join('') }))
  cache.set(rows, paths)
  return paths
}
