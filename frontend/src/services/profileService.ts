import { DEFAULT_BITBOT, FREE_ITEMS } from '../data/cosmetics'
import { GAMES } from '../data/games'
import { useHistoryStore } from '../stores/historyStore'
import { usePlayerStore } from '../stores/playerStore'
import type { AvatarId, GameId, GameRecord, Player } from '../types'
import { generateToken } from '../utils/token'
import { ApiError, apiRequest } from './api'

export interface RegisteredPlayer {
  id: string
  username: string
  avatar: AvatarId
  createdAt: string
  /** Solo llega al crear el perfil */
  recoveryCode?: string
}

/**
 * Registra el perfil en el servidor, que verifica que el nombre esté disponible (sección 4.1),
 * junto con el token de este dispositivo (sección 4.3).
 * Con `id` se registra un perfil que ya existía en este dispositivo; repetirlo no crea duplicados.
 * Lanza `ApiError` con código `username-taken` si el nombre ya existe.
 */
export function registerPlayer(username: string, avatar: AvatarId, token: string, id?: string): Promise<RegisteredPlayer> {
  return apiRequest<RegisteredPlayer>('POST', '/api/players', { id, username: username.trim(), avatar, token })
}

const profileClaimed = () =>
  new ApiError(409, 'profile-claimed', 'Este perfil ya está protegido. Recupéralo con tu código secreto.')

/**
 * Devuelve el token con que el perfil se identifica ante el servidor, registrándolo si hace falta:
 * los perfiles creados antes de la etapa 3, o antes de existir la autenticación, se registran con su mismo id.
 * Devuelve `null` si otro jugador tomó el nombre o si otro dispositivo ya protegió el perfil.
 */
export async function ensureRegistered(playerId: string): Promise<string | null> {
  const player = usePlayerStore.getState().profiles.find((p) => p.id === playerId)
  if (!player || player.nameConflict || player.needsRecovery) return null
  if (player.registered && player.authToken) return player.authToken
  const { updateProfile } = usePlayerStore.getState()
  // Se guarda antes de enviarlo: si se pierde la respuesta, el reintento usa el mismo token
  const token = player.authToken ?? generateToken()
  if (!player.authToken) updateProfile(playerId, { authToken: token })
  try {
    const { recoveryCode } = await registerPlayer(player.username, player.avatar, token, player.id)
    updateProfile(playerId, { registered: true, ...(recoveryCode && { recoveryCode }) })
    return token
  } catch (err) {
    if (err instanceof ApiError && err.code === 'profile-claimed') {
      updateProfile(playerId, { needsRecovery: true })
      return null
    }
    if (err instanceof ApiError && err.status === 409) {
      updateProfile(playerId, { nameConflict: true })
      return null
    }
    throw err
  }
}

/** Crea el código de un perfil registrado antes de existir los códigos. `ApiError` 409 si ya tenía uno. */
export async function createRecoveryCode(playerId: string): Promise<string> {
  const token = await ensureRegistered(playerId)
  if (!token) throw profileClaimed()
  const { recoveryCode } = await apiRequest<{ recoveryCode: string }>(
    'POST',
    `/api/players/${playerId}/recovery-code`,
    undefined,
    token,
  )
  usePlayerStore.getState().updateProfile(playerId, { recoveryCode, recoveryCodeSeen: true })
  return recoveryCode
}

/** `abcd efgh` → `ABCD-EFGH` */
export function formatRecoveryCode(code: string): string {
  const clean = code.toUpperCase().replace(/[\s-]/g, '')
  return clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean
}

interface RecoveredGame {
  id: string
  game: GameId
  result: GameRecord['result']
  durationMs: number
  xpEarned: number
  bitsEarned: number
  summary: string
  playedAt: string
  details: Record<string, unknown> | null
}

interface RecoverResponse {
  player: {
    id: string
    username: string
    avatar: AvatarId
    createdAt: string
    progress: { xp: number; bits: number }
    achievements: { id: string }[]
    items: string[]
  }
  games: RecoveredGame[]
}

/**
 * Descarga un perfil del servidor con su nombre y código secreto, lo guarda en este dispositivo
 * con su historial y lo activa; el servidor autoriza un token nuevo para este dispositivo.
 * Lanza `ApiError` 401 si los datos no coinciden y 429 tras varios intentos.
 */
export async function recoverProfile(username: string, code: string): Promise<Player> {
  const token = generateToken()
  const { player, games } = await apiRequest<RecoverResponse>('POST', '/api/players/recover', {
    username: username.trim(),
    code,
    token,
  })
  const restored: Player = {
    id: player.id,
    username: player.username,
    avatar: player.avatar,
    xp: player.progress.xp,
    bits: player.progress.bits,
    achievements: player.achievements.map((a) => a.id),
    items: [...new Set([...FREE_ITEMS, ...player.items])],
    pendingItems: [],
    bitbot: { ...DEFAULT_BITBOT },
    createdAt: player.createdAt,
    registered: true,
    authToken: token,
    recoveryCode: formatRecoveryCode(code),
    recoveryCodeSeen: true,
  }
  useHistoryStore.getState().mergeRecords(
    games.map((g) => ({
      id: g.id,
      playerId: player.id,
      game: g.game,
      result: g.result,
      durationMs: g.durationMs,
      xpEarned: g.xpEarned,
      bitsEarned: g.bitsEarned,
      // Las partidas guardadas antes de registrar el texto del historial no lo tienen
      summary: g.summary || GAMES[g.game].name,
      details: g.details ?? undefined,
      playedAt: g.playedAt,
      syncStatus: 'synced',
    })),
  )
  usePlayerStore.getState().restoreProfile(restored)
  return restored
}
