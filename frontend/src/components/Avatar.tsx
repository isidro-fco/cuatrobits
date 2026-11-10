/**
 * Archivo: Avatar.tsx
 * Módulo: frontend / components
 * Descripción: Avatar del jugador dibujado en pixel art.
 * Requerimientos: RF01, RF06, RNF08
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import { obtenerAvatar } from '../data/avatares'
import { spriteAvatar, type AparienciaBitBot } from '../data/cosmeticos'
import type { IdAvatar } from '../types'
import { SpritePixel } from './SpritePixel'
import { SPRITES_AVATAR } from '../data/sprites'

// ---------- Tipos ----------
interface PropsAvatar {
  id: IdAvatar
  tamano?: number
  tieneEtiqueta?: boolean
  /** Artículos del Taller que lleva puestos; sin ellos se dibuja el avatar original */
  apariencia?: AparienciaBitBot
}

// ---------- Componente Avatar ----------
/**
 * Avatar del jugador dibujado en pixel art; con `apariencia` lleva los mismos accesorios que su
 * BitBot.
 * @param props Propiedades del componente
 * @param props.id Avatar elegido en el registro
 * @param props.tamano Tamaño en píxeles
 * @param props.tieneEtiqueta Verdadero para que el nombre del avatar sea su texto accesible;
 *   si no, es decorativo
 * @param props.apariencia Color y accesorio que eligió el jugador para BitBot
 * @returns Avatar sobre su color de fondo
 * @see RF01, RF06
 */
export function Avatar({ id, tamano = 56, tieneEtiqueta = false, apariencia }: PropsAvatar) {
  const informacion = obtenerAvatar(id)
  return (
    <span
      className="avatar"
      style={{ background: informacion.fondo, width: tamano, height: tamano }}
    >
      <SpritePixel
        sprite={apariencia ? spriteAvatar(id, apariencia) : SPRITES_AVATAR[id]}
        tamano={tamano * 0.72}
        titulo={tieneEtiqueta ? informacion.nombre : undefined}
      />
    </span>
  )
}
