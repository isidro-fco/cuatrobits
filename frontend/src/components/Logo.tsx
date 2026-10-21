import { Link } from 'react-router'
import { PixelSprite } from './PixelSprite'
import { BITBOT_SPRITE } from '../data/sprites'

/** Ícono y nombre de CuatroBits, sin enlace */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <>
      <span className="logo__icon">
        <PixelSprite sprite={BITBOT_SPRITE} size={size} />
      </span>
      <span className="logo__text">
        Cuatro<span>Bits</span>
      </span>
    </>
  )
}

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="CuatroBits, ir al lobby">
      <LogoMark />
    </Link>
  )
}
