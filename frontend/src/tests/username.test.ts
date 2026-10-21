import { describe, expect, it } from 'vitest'
import { normalizeUsername, validateUsername } from '../utils/username'

describe('normalizeUsername', () => {
  it('no distingue mayúsculas (sección 4.1)', () => {
    expect(normalizeUsername('Jugador01')).toBe(normalizeUsername('jugador01'))
  })

  it('ignora espacios al inicio y al final', () => {
    expect(normalizeUsername('  Luna ')).toBe('luna')
  })
})

describe('validateUsername', () => {
  it('acepta letras con tilde, ñ, números y guion bajo', () => {
    expect(validateUsername('Ñandú_7')).toBeNull()
  })

  it('rechaza nombres demasiado cortos o largos', () => {
    expect(validateUsername('ab')).not.toBeNull()
    expect(validateUsername('a'.repeat(16))).not.toBeNull()
  })

  it('rechaza espacios y símbolos', () => {
    expect(validateUsername('Luna Azul')).not.toBeNull()
    expect(validateUsername('luna!')).not.toBeNull()
  })
})
