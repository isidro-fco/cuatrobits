// Recuperación de perfiles en otro dispositivo con el código secreto
import type { Database } from '../config/database.js'
import { hashToken } from '../models/auth.js'
import { AppError } from '../models/errors.js'
import { generateRecoveryCode, hashRecoveryCode, verifyRecoveryCode } from '../models/recovery.js'
import { normalizeUsername } from '../models/schemas.js'
import { listGames } from '../repositories/gameRepository.js'
import { findPlayerByNormalizedName, setRecoveryHash } from '../repositories/playerRepository.js'
import { addToken } from '../repositories/tokenRepository.js'
import { getPlayer, requirePlayer, toGameDto } from './playerService.js'

/** Partidas que se devuelven al recuperar un perfil */
const MAX_RECOVERED_GAMES = 5000

/**
 * Limita los intentos fallidos por nombre para que no se pueda adivinar el código probando.
 * Vive en memoria: cada instancia del servidor lleva su propia cuenta.
 */
export class AttemptLimiter {
  private readonly failures = new Map<string, { count: number; resetAt: number }>()

  constructor(
    private readonly maxFailures = 5,
    private readonly windowMs = 15 * 60 * 1000,
    private readonly now: () => number = Date.now,
  ) {}

  isBlocked(key: string): boolean {
    const entry = this.failures.get(key)
    if (!entry) return false
    if (entry.resetAt <= this.now()) {
      this.failures.delete(key)
      return false
    }
    return entry.count >= this.maxFailures
  }

  fail(key: string) {
    const entry = this.failures.get(key)
    if (!entry || entry.resetAt <= this.now()) this.failures.set(key, { count: 1, resetAt: this.now() + this.windowMs })
    else entry.count++
  }

  reset(key: string) {
    this.failures.delete(key)
  }
}

/**
 * Crea el código de un perfil registrado antes de existir los códigos. Solo funciona una vez:
 * después, nadie más puede reemplazarlo con solo conocer el identificador.
 */
export async function createRecoveryCode(db: Database, id: string): Promise<string> {
  await requirePlayer(db, id)
  const code = generateRecoveryCode()
  if (!(await setRecoveryHash(db, id, await hashRecoveryCode(code)))) {
    throw new AppError(409, 'code-exists', 'Este perfil ya tiene un código secreto.')
  }
  return code
}

const invalid = () => new AppError(401, 'invalid-recovery', 'El nombre o el código secreto no son correctos.')

/**
 * Devuelve el perfil completo y su historial si el código corresponde al nombre, y autoriza
 * el token del nuevo dispositivo. Los demás dispositivos del jugador conservan su sesión.
 */
export async function recoverPlayer(
  db: Database,
  limiter: AttemptLimiter,
  input: { username: string; code: string; token: string },
) {
  const { username, code } = input
  const key = normalizeUsername(username)
  if (limiter.isBlocked(key)) {
    throw new AppError(429, 'too-many-attempts', 'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.')
  }
  const row = await findPlayerByNormalizedName(db, key)
  if (!row?.recovery_hash || !(await verifyRecoveryCode(code, row.recovery_hash))) {
    limiter.fail(key)
    throw invalid()
  }
  limiter.reset(key)
  if (!(await addToken(db, row.id, hashToken(input.token)))) {
    throw new AppError(409, 'token-taken', 'Ese token ya pertenece a otro jugador.')
  }
  const { games } = await listGames(db, row.id, MAX_RECOVERED_GAMES, 0)
  return { player: await getPlayer(db, row.id), games: games.map(toGameDto) }
}
