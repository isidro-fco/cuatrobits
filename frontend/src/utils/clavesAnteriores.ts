/**
 * Archivo: clavesAnteriores.ts
 * Módulo: frontend / utils
 * Descripción: Traduce al español las claves del estado guardado en localStorage por versiones
 *              anteriores, que usaban nombres en inglés.
 * Requerimientos: RF03, RIE03, RNF11
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-11-09
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Constantes ----------
/** Clave anterior (inglés) -> clave actual (español) de los datos persistidos */
export const CLAVES_ANTERIORES: Readonly<Record<string, string>> = {
  // Store de jugadores
  profiles: 'perfiles',
  activeId: 'idActivo',
  achievements: 'logros',
  items: 'articulos',
  pendingItems: 'articulosPendientes',
  accessory: 'accesorio',
  createdAt: 'creadoEn',
  registered: 'estaRegistrado',
  nameConflict: 'tieneConflictoNombre',
  authToken: 'tokenAutenticacion',
  needsRecovery: 'esRecuperacionNecesaria',
  recoveryCode: 'codigoRecuperacion',
  recoveryCodeSeen: 'esCodigoRecuperacionVisto',
  // Store del historial
  records: 'registros',
  playerId: 'jugadorId',
  game: 'juego',
  result: 'resultado',
  durationMs: 'duracionMs',
  xpEarned: 'xpObtenida',
  bitsEarned: 'bitsObtenidos',
  summary: 'resumen',
  details: 'detalles',
  playedAt: 'jugadaEn',
  syncStatus: 'estadoSincronizacion',
  syncError: 'errorSincronizacion',
  // Detalles de cada minijuego
  players: 'jugadores',
  mode: 'modo',
  difficulty: 'dificultad',
  moves: 'movimientos',
  winner: 'ganador',
  category: 'categoria',
  word: 'palabra',
  correctLetters: 'letrasCorrectas',
  wrongLetters: 'letrasIncorrectas',
  attemptsUsed: 'intentosUsados',
  errors: 'errores',
  colors: 'colores',
  completed: 'estaCompletada',
  pairs: 'parejas',
  attempts: 'intentos',
  // Store de ajustes
  music: 'estaMusicaActiva',
  sfx: 'estaSonidoActivo',
  reducedMotion: 'esMovimientoReducido',
  showTimer: 'esCronometroVisible',
}

// ---------- Funciones ----------
/**
 * Copia un valor cambiando, en todos los niveles, las claves anteriores por las actuales.
 * Los valores (textos, números, ids) no se modifican.
 * @param valor Estado leído de localStorage
 * @returns Copia del estado con las claves en español
 * @see RF03, RIE03
 */
export function traducirClaves(valor: unknown): unknown {
  if (Array.isArray(valor)) {
    return valor.map(traducirClaves)
  }
  if (valor !== null && typeof valor === 'object') {
    return Object.fromEntries(
      Object.entries(valor).map(([clave, contenido]) => [
        CLAVES_ANTERIORES[clave] ?? clave,
        traducirClaves(contenido),
      ]),
    )
  }
  return valor
}
