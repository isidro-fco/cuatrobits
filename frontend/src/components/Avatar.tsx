import { getAvatar } from '../data/avatars'
import { avatarSprite, type BitBotLook } from '../data/cosmetics'
import type { AvatarId } from '../types'
import { PixelSprite } from './PixelSprite'
import { AVATAR_SPRITES } from '../data/sprites'

interface AvatarProps {
  id: AvatarId
  size?: number
  label?: boolean
  /** Artículos del Taller que lleva puestos; sin ellos se dibuja el avatar original */
  look?: BitBotLook
}

export function Avatar({ id, size = 56, label = false, look }: AvatarProps) {
  const info = getAvatar(id)
  return (
    <span className="avatar" style={{ background: info.background, width: size, height: size }}>
      <PixelSprite sprite={look ? avatarSprite(id, look) : AVATAR_SPRITES[id]} size={size * 0.72} title={label ? info.name : undefined} />
    </span>
  )
}
