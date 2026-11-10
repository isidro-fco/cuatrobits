/**
 * Archivo: progresion.test.ts
 * Módulo: frontend / tests
 * Descripción: Pruebas de la tabla de niveles.
 * Requerimientos: RF47
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { describe, expect, it } from 'vitest'

// ---------- Módulos internos ----------
import { calcularNivel, xpParaSiguienteNivel } from '../utils/progresion'

// ---------- Pruebas ----------
describe('calcularNivel', () => {
  it('empieza en el nivel 1 sin experiencia', () => {
    expect(calcularNivel(0)).toEqual({ nivel: 1, xpEnNivel: 0, requerido: xpParaSiguienteNivel(1) })
  })

  it('sube de nivel al alcanzar la XP requerida', () => {
    expect(calcularNivel(xpParaSiguienteNivel(1)).nivel).toBe(2)
    expect(calcularNivel(xpParaSiguienteNivel(1) - 1).nivel).toBe(1)
  })

  it('conserva la XP sobrante dentro del nivel', () => {
    const total = xpParaSiguienteNivel(1) + xpParaSiguienteNivel(2) + 30
    expect(calcularNivel(total)).toEqual({
      nivel: 3,
      xpEnNivel: 30,
      requerido: xpParaSiguienteNivel(3),
    })
  })

  it('trata la XP negativa como cero', () => {
    expect(calcularNivel(-50).nivel).toBe(1)
  })
})
