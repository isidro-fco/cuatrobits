import { useMemo } from 'react'
import { bitbotSprite, DEFAULT_BITBOT } from '../data/cosmetics'
import type { SpriteDefinition } from '../data/sprites'
import { useActivePlayer } from '../stores/playerStore'

/** BitBot con la apariencia que eligió el jugador activo */
export function useBitBotSprite(): SpriteDefinition {
  const look = useActivePlayer()?.bitbot ?? DEFAULT_BITBOT
  return useMemo(() => bitbotSprite(look), [look])
}
