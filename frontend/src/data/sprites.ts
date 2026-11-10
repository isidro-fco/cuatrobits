/**
 * Archivo: sprites.ts
 * Módulo: frontend / data
 * Descripción: Sprites de BitBot y de los avatares, con los anclajes de los accesorios.
 * Requerimientos: RF28, RF49, RNF08
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import type { IdAvatar } from '../types'

// ---------- Tipos ----------
export interface DefinicionSprite {
  /** Mitad izquierda de cada fila; se refleja para obtener un sprite simétrico */
  mitad: string[]
  paleta: Record<string, string>
}

export type AnclaAccesorio = 'top' | 'eyes' | 'neck'

// ---------- Constantes ----------
/** Color azul marino del contorno de los sprites */
const AZUL_MARINO = '#14295c'
/** Color blanco que comparten las paletas de los sprites */
const BLANCO = '#ffffff'

/** Sprite base de BitBot; el color del cuerpo cambia con el Taller */
export const SPRITE_BITBOT: DefinicionSprite = {
  mitad: [
    '.....y',
    '.....k',
    '.bbbbb',
    '.bwwww',
    '.bwkkw',
    '.bwkkw',
    '.bwwww',
    '.bwwwk',
    '.bwwww',
    '.bbbbb',
    '...bbb',
    '..bbbb',
  ],
  paleta: { b: '#1a6be8', w: BLANCO, k: AZUL_MARINO, y: '#ffd35c' },
}

/** Sprite de cada avatar de la colección */
export const SPRITES_AVATAR: Record<IdAvatar, DefinicionSprite> = {
  robot: SPRITE_BITBOT,
  cat: {
    mitad: [
      '.o....',
      '.oo...',
      '.ooo..',
      '.ooooo',
      '.ooooo',
      '.okkoo',
      '.ooooo',
      'kooolp',
      '.oolll',
      '..oooo',
      '...ooo',
      '......',
    ],
    paleta: { o: '#ff8c42', l: '#ffe1c7', k: AZUL_MARINO, p: '#f07cb2' },
  },
  dino: {
    mitad: [
      '.....d',
      '....dd',
      '..gggd',
      '.ggggg',
      '.gwkgg',
      '.ggggg',
      '.ggggg',
      'gggggg',
      'gwgwgw',
      '.ggggg',
      '..gggg',
      '......',
    ],
    paleta: { g: '#5ccf7a', d: '#2f9e5a', w: BLANCO, k: AZUL_MARINO },
  },
  fox: {
    mitad: [
      'f.....',
      'ff....',
      'fff...',
      'ffffff',
      'ffffff',
      '.fkfff',
      'wwffff',
      '.wwfff',
      '..wwkk',
      '...www',
      '......',
      '......',
    ],
    paleta: { f: '#9b7cf0', w: BLANCO, k: AZUL_MARINO },
  },
  astronaut: {
    mitad: [
      '..ssss',
      '.swwww',
      'swwwww',
      'swvvvv',
      'swvcvv',
      'swvvvv',
      'swvvvv',
      'swwwww',
      '.swwww',
      '..ssss',
      '.srwww',
      '.swwww',
    ],
    paleta: { s: '#b9c5d3', w: BLANCO, v: AZUL_MARINO, c: '#45c6db', r: '#ef5b5b' },
  },
  monster: {
    mitad: [
      '.o....',
      '.oo...',
      '..yyyy',
      '.yyyyy',
      '.yyyww',
      '.yyywk',
      '.yyyww',
      '.yyyyy',
      '.yykyk',
      '.yyyyy',
      '..y.yy',
      '......',
    ],
    paleta: { y: '#ffd35c', o: '#e0a800', w: BLANCO, k: AZUL_MARINO },
  },
}

/**
 * Cómo se visten los avatares con los artículos del Taller: `cuerpo` es la letra de la paleta que
 * cambia con los colores y cada anclaje dice cuántas filas se mueven los accesorios respecto a
 * BitBot.
 */
export const AJUSTE_AVATAR: Record<IdAvatar, { cuerpo: string } & Record<AnclaAccesorio, number>> =
  {
    robot: { cuerpo: 'b', top: 0, eyes: 0, neck: 0 },
    cat: { cuerpo: 'o', top: 1, eyes: 1, neck: 0 },
    dino: { cuerpo: 'g', top: 0, eyes: 0, neck: 0 },
    fox: { cuerpo: 'f', top: 1, eyes: 1, neck: -1 },
    astronaut: { cuerpo: 's', top: 0, eyes: 0, neck: 0 },
    monster: { cuerpo: 'y', top: 0, eyes: 0, neck: -1 },
  }
