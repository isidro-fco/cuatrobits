/**
 * Archivo: useSpriteBitBot.ts
 * Módulo: frontend / hooks
 * Descripción: Hook que devuelve BitBot con la apariencia que eligió el jugador activo.
 * Requerimientos: RF49
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { useMemo } from 'react'

// ---------- Módulos internos ----------
import { spriteBitBot, BITBOT_PREDETERMINADO } from '../data/cosmeticos'
import type { DefinicionSprite } from '../data/sprites'
import { useJugadorActivo } from '../stores/useJugadorStore'

// ---------- Hook useSpriteBitBot ----------
/**
 * BitBot con la apariencia que eligió el jugador activo
 * @returns Sprite de BitBot
 * @see RF49
 */
export function useSpriteBitBot(): DefinicionSprite {
  const apariencia = useJugadorActivo()?.bitbot ?? BITBOT_PREDETERMINADO
  return useMemo(() => spriteBitBot(apariencia), [apariencia])
}
