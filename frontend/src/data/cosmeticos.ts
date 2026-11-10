/**
 * Archivo: cosmeticos.ts
 * Módulo: frontend / data
 * Descripción: Artículos de BitBot que se compran con Bits (sección 9.4). Los precios deben
 *              coincidir con backend/src/models/cosmeticos.ts.
 * Requerimientos: RF49
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import type { IdAvatar } from '../types'
import {
  AJUSTE_AVATAR,
  SPRITES_AVATAR,
  SPRITE_BITBOT,
  type AnclaAccesorio,
  type DefinicionSprite,
} from './sprites'

// ---------- Tipos ----------
export type TipoCosmetico = 'color' | 'accesorio'

export interface AparienciaBitBot {
  color: string
  accesorio: string
}

export interface ArticuloCosmetico {
  id: string
  tipo: TipoCosmetico
  nombre: string
  precio: number
  /** Color del cuerpo de BitBot */
  color?: string
  /** Filas que reemplazan las del sprite (mitad izquierda); `.` conserva el píxel original */
  superposicion?: Record<number, string>
  /**
   * Parte del cuerpo donde va el accesorio; las filas de `superposicion` están medidas sobre BitBot
   */
  ancla?: AnclaAccesorio
  paleta?: Record<string, string>
}

// ---------- Constantes ----------
/** Artículos del Taller de BitBot con su precio en Bits */
export const COSMETICOS: ArticuloCosmetico[] = [
  { id: 'color-blue', tipo: 'color', nombre: 'Azul clásico', precio: 0, color: '#1a6be8' },
  { id: 'color-mint', tipo: 'color', nombre: 'Verde menta', precio: 30, color: '#2bb59a' },
  { id: 'color-orange', tipo: 'color', nombre: 'Naranja', precio: 40, color: '#ff8c42' },
  { id: 'color-lilac', tipo: 'color', nombre: 'Lila', precio: 50, color: '#9b6bdf' },
  { id: 'color-red', tipo: 'color', nombre: 'Rojo', precio: 60, color: '#e5484d' },
  { id: 'color-gold', tipo: 'color', nombre: 'Dorado', precio: 120, color: '#d9a21b' },
  { id: 'accessory-none', tipo: 'accesorio', nombre: 'Sin accesorio', precio: 0 },
  {
    id: 'accessory-bow',
    tipo: 'accesorio',
    nombre: 'Moño',
    ancla: 'neck',
    precio: 30,
    superposicion: { 10: '...ppq' },
    paleta: { p: '#f07cb2', q: '#c2457f' },
  },
  {
    id: 'accessory-cap',
    tipo: 'accesorio',
    nombre: 'Gorro',
    ancla: 'top',
    precio: 40,
    superposicion: { 0: '...rrr', 1: '..rrrr', 2: 'RRRRRR' },
    paleta: { r: '#e5484d', R: '#14295c' },
  },
  {
    id: 'accessory-glasses',
    tipo: 'accesorio',
    nombre: 'Lentes de sol',
    ancla: 'eyes',
    precio: 50,
    superposicion: { 4: '..kckk', 5: '..kkkw' },
    paleta: { k: '#14295c', c: '#8fd3ff', w: '#ffffff' },
  },
  {
    id: 'accessory-headphones',
    tipo: 'accesorio',
    nombre: 'Audífonos',
    ancla: 'top',
    precio: 60,
    superposicion: { 1: '.kkkkk', 2: 'k.....', 3: 'k.....', 4: 'h.....', 5: 'h.....', 6: 'h.....' },
    paleta: { k: '#14295c', h: '#ff8c42' },
  },
  {
    id: 'accessory-crown',
    tipo: 'accesorio',
    nombre: 'Corona',
    ancla: 'top',
    precio: 100,
    superposicion: { 0: '.y.y.y', 1: '.yyyyg' },
    paleta: { y: '#ffc21a', g: '#e5484d' },
  },
]

/** Apariencia de BitBot de un jugador que no ha comprado nada */
export const BITBOT_PREDETERMINADO = { color: 'color-blue', accesorio: 'accessory-none' }

/** Artículos gratuitos que todos los jugadores tienen desde el inicio */
export const ARTICULOS_GRATIS = COSMETICOS.filter((articulo) => articulo.precio === 0).map(
  (articulo) => articulo.id,
)

// ---------- Funciones ----------
/**
 * Busca un artículo del Taller por su identificador.
 * @param id Identificador del artículo
 * @returns El artículo o undefined si no existe
 * @see RF49
 */
export function buscarCosmetico(id: string): ArticuloCosmetico | undefined {
  return COSMETICOS.find((articulo) => articulo.id === id)
}

/**
 * Color del cuerpo de BitBot para un artículo de color.
 * @param idColor Identificador del artículo de color
 * @returns Color en hexadecimal; azul si el id no es un color
 * @see RF49
 */
export function colorCuerpoBitBot(idColor: string): string {
  return buscarCosmetico(idColor)?.color ?? SPRITE_BITBOT.paleta.b
}

/** Sprite con el color y el accesorio elegidos puestos sobre `base` */
function vestir(
  base: DefinicionSprite,
  avatar: IdAvatar,
  apariencia: AparienciaBitBot,
): DefinicionSprite {
  const ajuste = AJUSTE_AVATAR[avatar]
  const accesorio = buscarCosmetico(apariencia.accesorio)
  const corrimiento = accesorio?.ancla ? ajuste[accesorio.ancla] : 0
  // Los colores del accesorio usan dígitos para no pisar las letras de la paleta del avatar
  const claves = Object.keys(accesorio?.paleta ?? {})
  const mitad = base.mitad.map((fila, indice) => {
    const superposicion = accesorio?.superposicion?.[indice - corrimiento]
    if (!superposicion) {
      return fila
    }
    return [...fila]
      .map((caracter, indice) =>
        superposicion[indice] === '.' ? caracter : String(claves.indexOf(superposicion[indice])),
      )
      .join('')
  })
  const paletaAccesorio = Object.fromEntries(
    claves.map((clave, i) => [String(i), accesorio!.paleta![clave]]),
  )
  // El color gratuito deja a cada avatar con su color original
  const cuerpo =
    apariencia.color === BITBOT_PREDETERMINADO.color
      ? {}
      : { [ajuste.cuerpo]: colorCuerpoBitBot(apariencia.color) }
  return { mitad, paleta: { ...base.paleta, ...cuerpo, ...paletaAccesorio } }
}

/**
 * Sprite de BitBot con el color y el accesorio elegidos
 * @param apariencia Color y accesorio que eligió el jugador para BitBot
 * @returns Sprite listo para dibujarse
 * @see RF49
 */
export function spriteBitBot(apariencia: AparienciaBitBot): DefinicionSprite {
  return vestir(SPRITE_BITBOT, 'robot', apariencia)
}

/**
 * Avatar del jugador con los mismos artículos que lleva su BitBot
 * @param avatar Avatar elegido en el registro
 * @param apariencia Color y accesorio que eligió el jugador para BitBot
 * @returns Sprite del avatar con los accesorios
 * @see RF49
 */
export function spriteAvatar(avatar: IdAvatar, apariencia: AparienciaBitBot): DefinicionSprite {
  return vestir(SPRITES_AVATAR[avatar], avatar, apariencia)
}
