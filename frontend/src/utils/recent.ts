// Recuerda qué palabras e imágenes salieron en las últimas partidas para no repetirlas tan seguido.
// Es una comodidad: si el navegador no deja guardar, los juegos siguen funcionando sin ella.
const STORAGE_KEY = 'cuatrobits-recent'

function load(): Record<string, string[]> {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    return data && typeof data === 'object' ? (data as Record<string, string[]>) : {}
  } catch {
    return {}
  }
}

/** Elementos usados recientemente en `list` (por ejemplo `bitbot:animals`), del más nuevo al más viejo */
export function getRecent(list: string): string[] {
  const items = load()[list]
  return Array.isArray(items) ? items.filter((item) => typeof item === 'string') : []
}

/** Agrega `used` al principio de la lista y conserva solo los `keep` más nuevos */
export function rememberRecent(list: string, used: string[], keep: number): void {
  const data = load()
  data[list] = [...new Set([...used, ...getRecent(list)])].slice(0, Math.max(0, keep))
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Sin almacenamiento solo se pierde la variedad entre partidas
  }
}
