import type { AvatarId } from '../types'

export interface AvatarInfo {
  id: AvatarId
  name: string
  background: string
}

export const AVATARS: AvatarInfo[] = [
  { id: 'robot', name: 'Robot azul', background: 'var(--blue-soft)' },
  { id: 'cat', name: 'Gato naranja', background: 'var(--orange-soft)' },
  { id: 'dino', name: 'Dinosaurio verde', background: 'var(--mint-soft)' },
  { id: 'fox', name: 'Zorro morado', background: 'var(--lilac-soft)' },
  { id: 'astronaut', name: 'Astronauta blanco', background: 'var(--gray-soft)' },
  { id: 'monster', name: 'Monstruo amarillo', background: 'var(--yellow-soft)' },
]

export function getAvatar(id: AvatarId): AvatarInfo {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0]
}
