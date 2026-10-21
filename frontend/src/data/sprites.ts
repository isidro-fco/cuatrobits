import type { AvatarId } from '../types'

export interface SpriteDefinition {
  /** Mitad izquierda de cada fila; se refleja para obtener un sprite simétrico */
  half: string[]
  palette: Record<string, string>
}

const NAVY = '#14295c'
const WHITE = '#ffffff'

export const BITBOT_SPRITE: SpriteDefinition = {
  half: [
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
  palette: { b: '#1a6be8', w: WHITE, k: NAVY, y: '#ffd35c' },
}

export const AVATAR_SPRITES: Record<AvatarId, SpriteDefinition> = {
  robot: BITBOT_SPRITE,
  cat: {
    half: [
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
    palette: { o: '#ff8c42', l: '#ffe1c7', k: NAVY, p: '#f07cb2' },
  },
  dino: {
    half: [
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
    palette: { g: '#5ccf7a', d: '#2f9e5a', w: WHITE, k: NAVY },
  },
  fox: {
    half: [
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
    palette: { f: '#9b7cf0', w: WHITE, k: NAVY },
  },
  astronaut: {
    half: [
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
    palette: { s: '#b9c5d3', w: WHITE, v: NAVY, c: '#45c6db', r: '#ef5b5b' },
  },
  monster: {
    half: [
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
    palette: { y: '#ffd35c', o: '#e0a800', w: WHITE, k: NAVY },
  },
}

export type AccessoryAnchor = 'top' | 'eyes' | 'neck'

/**
 * Cómo se visten los avatares con los artículos del Taller: `body` es la letra de la paleta que
 * cambia con los colores y cada anclaje dice cuántas filas se mueven los accesorios respecto a BitBot.
 */
export const AVATAR_FIT: Record<AvatarId, { body: string } & Record<AccessoryAnchor, number>> = {
  robot: { body: 'b', top: 0, eyes: 0, neck: 0 },
  cat: { body: 'o', top: 1, eyes: 1, neck: 0 },
  dino: { body: 'g', top: 0, eyes: 0, neck: 0 },
  fox: { body: 'f', top: 1, eyes: 1, neck: -1 },
  astronaut: { body: 's', top: 0, eyes: 0, neck: 0 },
  monster: { body: 'y', top: 0, eyes: 0, neck: -1 },
}
