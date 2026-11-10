/**
 * Archivo: clavesAnteriores.test.ts
 * Módulo: frontend / tests
 * Descripción: Pruebas de la traducción de las claves guardadas por versiones anteriores.
 * Requerimientos: RF03, RIE03
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-11-09
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { describe, expect, it } from 'vitest'

// ---------- Módulos internos ----------
import { useAjustesStore } from '../stores/useAjustesStore'
import { useHistorialStore } from '../stores/useHistorialStore'
import { traducirClaves } from '../utils/clavesAnteriores'

// ---------- Pruebas ----------
// Los datos de estas pruebas usan a propósito las claves en inglés de las versiones anteriores
describe('estado guardado por versiones anteriores (claves en inglés)', () => {
  it('traduce las claves en todos los niveles sin tocar los valores', () => {
    expect(
      traducirClaves({
        records: [{ result: 'completed', details: { pairs: 4, completed: true }, word: 'GATO' }],
      }),
    ).toEqual({
      registros: [
        { resultado: 'completed', detalles: { parejas: 4, estaCompletada: true }, palabra: 'GATO' },
      ],
    })
  })

  it('el historial guardado antes del estándar conserva sus partidas', async () => {
    const partida = {
      id: 'p1',
      playerId: 'j1',
      game: 'memory',
      result: 'completed',
      durationMs: 1000,
      xpEarned: 10,
      summary: 'Animales · Fácil',
      details: { category: 'animals', difficulty: 'easy', pairs: 4, attempts: 6 },
      playedAt: '2026-10-20T10:00:00.000Z',
      syncStatus: 'pending',
    }
    localStorage.setItem(
      'cuatrobits-history',
      JSON.stringify({ state: { records: [partida] }, version: 1 }),
    )
    await useHistorialStore.persist.rehydrate()
    expect(useHistorialStore.getState().registros).toEqual([
      {
        id: 'p1',
        jugadorId: 'j1',
        juego: 'memory',
        resultado: 'completed',
        duracionMs: 1000,
        xpObtenida: 10,
        resumen: 'Animales · Fácil',
        detalles: { categoria: 'animals', dificultad: 'easy', parejas: 4, intentos: 6 },
        jugadaEn: '2026-10-20T10:00:00.000Z',
        estadoSincronizacion: 'pending',
      },
    ])
  })

  it('los ajustes guardados antes del estándar se conservan', async () => {
    localStorage.setItem(
      'cuatrobits-settings',
      JSON.stringify({
        state: { music: false, sfx: true, reducedMotion: true, showTimer: false },
        version: 1,
      }),
    )
    await useAjustesStore.persist.rehydrate()
    expect(useAjustesStore.getState()).toMatchObject({
      estaMusicaActiva: false,
      estaSonidoActivo: true,
      esMovimientoReducido: true,
      esCronometroVisible: false,
    })
  })
})
