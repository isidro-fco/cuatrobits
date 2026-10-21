export type GameId = 'connect-four' | 'bitbot' | 'ball-sort' | 'memory'

export type AvatarId = 'robot' | 'cat' | 'dino' | 'fox' | 'astronaut' | 'monster'

export type Difficulty = 'easy' | 'medium' | 'hard'

export type CategoryId =
  | 'animals'
  | 'colors'
  | 'fruits'
  | 'school'
  | 'transport'
  | 'nature'
  | 'space'
  | 'technology'

export interface Player {
  id: string
  username: string
  avatar: AvatarId
  xp: number
  bits: number
  achievements: string[]
  /** Artículos de BitBot comprados (sección 9.4) */
  items: string[]
  /** Compras que aún no se envían al servidor */
  pendingItems: string[]
  /** Apariencia elegida para BitBot */
  bitbot: { color: string; accessory: string }
  createdAt: string
  /** Ya existe en el servidor. Los perfiles anteriores a la etapa 3 se registran al sincronizar. */
  registered?: boolean
  /** El nombre lo tomó otro jugador antes de poder registrar este perfil */
  nameConflict?: boolean
  /** Token secreto con el que este dispositivo se identifica ante el servidor (sección 4.3) */
  authToken?: string
  /** El perfil quedó protegido por otro dispositivo: hay que recuperarlo con el código secreto */
  needsRecovery?: boolean
  /** Código secreto para recuperar el perfil en otro dispositivo */
  recoveryCode?: string
  /** El jugador ya vio el aviso para guardar su código */
  recoveryCodeSeen?: boolean
}

/** `rejected`: el servidor no aceptó la partida; se conserva solo en este dispositivo */
export type SyncStatus = 'pending' | 'synced' | 'rejected'

export interface GameRecord {
  id: string
  playerId: string
  game: GameId
  result: 'win' | 'loss' | 'draw' | 'completed'
  durationMs: number
  xpEarned: number
  /** No existe en las partidas guardadas antes de la etapa 4 */
  bitsEarned?: number
  summary: string
  /** Datos específicos del juego; se guardan en `game_details` */
  details?: Record<string, unknown>
  playedAt: string
  syncStatus: SyncStatus
  /** Motivo del rechazo del servidor */
  syncError?: string
}

export interface Settings {
  music: boolean
  sfx: boolean
  reducedMotion: boolean
  showTimer: boolean
}
