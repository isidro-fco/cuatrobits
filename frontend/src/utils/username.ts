export const USERNAME_MIN = 3
export const USERNAME_MAX = 15

const USERNAME_PATTERN = /^[\p{L}\p{N}_]+$/u

/** Forma usada para comparar nombres sin distinguir mayúsculas (sección 4.1) */
export function normalizeUsername(username: string): string {
  return username.trim().normalize('NFC').toLocaleLowerCase('es')
}

/** Devuelve un mensaje de error o `null` si el nombre es válido */
export function validateUsername(username: string): string | null {
  const name = username.trim()
  if (name.length < USERNAME_MIN) return `Tu nombre debe tener al menos ${USERNAME_MIN} letras.`
  if (name.length > USERNAME_MAX) return `Tu nombre puede tener hasta ${USERNAME_MAX} letras.`
  if (!USERNAME_PATTERN.test(name)) return 'Usa solo letras, números o guion bajo (_).'
  return null
}
