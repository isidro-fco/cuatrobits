import { getAvatar } from '../data/avatars'
import type { AvatarId } from '../types'
import { PixelSprite } from './PixelSprite'
import { AVATAR_SPRITES } from '../data/sprites'

interface AvatarProps {
  id: AvatarId
  size?: number
  label?: boolean
}

export function Avatar({ id, size = 56, label = false }: AvatarProps) {
  const info = getAvatar(id)
  return (
    <span className="avatar" style={{ background: info.background, width: size, height: size }}>
      <PixelSprite sprite={AVATAR_SPRITES[id]} size={size * 0.72} title={label ? info.name : undefined} />
    </span>
  )
}
