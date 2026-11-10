/**
 * Archivo: username.test.ts
 * Módulo: frontend / tests
 * Descripción: Pruebas de la normalización y validación del nombre de usuario.
 * Requerimientos: RF02
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { describe, expect, it } from 'vitest'

// ---------- Módulos internos ----------
import { normalizarUsername, validarUsername } from '../utils/username'

// ---------- Pruebas ----------
describe('normalizarUsername', () => {
  it('no distingue mayúsculas (sección 4.1)', () => {
    expect(normalizarUsername('Jugador01')).toBe(normalizarUsername('jugador01'))
  })

  it('ignora espacios al inicio y al final', () => {
    expect(normalizarUsername('  Luna ')).toBe('luna')
  })
})

describe('validarUsername', () => {
  it('acepta letras con tilde, ñ, números y guion bajo', () => {
    expect(validarUsername('Ñandú_7')).toBeNull()
  })

  it('rechaza nombres demasiado cortos o largos', () => {
    expect(validarUsername('ab')).not.toBeNull()
    expect(validarUsername('a'.repeat(16))).not.toBeNull()
  })

  it('rechaza espacios y símbolos', () => {
    expect(validarUsername('Luna Azul')).not.toBeNull()
    expect(validarUsername('luna!')).not.toBeNull()
  })
})
