import { Link } from 'react-router'
import { PixelSprite } from './PixelSprite'
import { BITBOT_SPRITE } from '../data/sprites'

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="CuatroBits, ir al lobby">
      <span className="logo__icon">
        <PixelSprite sprite={BITBOT_SPRITE} size={40} />
      </span>
      <span className="logo__text">
        Cuatro<span>Bits</span>
      </span>
    </Link>
  )
}
