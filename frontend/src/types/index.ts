/**
 * Archivo: index.ts
 * Módulo: frontend / types
 * Descripción: Tipos compartidos del dominio: jugador, partida, identificadores de juego, avatar y
 *              categoría.
 * Requerimientos: RF01, RF50, RNF10
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Tipos ----------
// ---------- Tipos ----------
export type IdJuego = 'connect-four' | 'bitbot' | 'ball-sort' | 'memory'

export type IdAvatar = 'robot' | 'cat' | 'dino' | 'fox' | 'astronaut' | 'monster'

export type Dificultad = 'easy' | 'medium' | 'hard'

export type IdCategoria =
  'animals' | 'colors' | 'fruits' | 'school' | 'transport' | 'nature' | 'space' | 'technology'

export interface Jugador {
  id: string
  username: string
  avatar: IdAvatar
  xp: number
  bits: number
  logros: string[]
  /** Artículos de BitBot comprados (sección 9.4) */
  articulos: string[]
  /** Compras que aún no se envían al servidor */
  articulosPendientes: string[]
  /** Apariencia elegida para BitBot */
  bitbot: { color: string; accesorio: string }
  creadoEn: string
  /** Ya existe en el servidor. Los perfiles anteriores a la etapa 3 se registran al sincronizar. */
  estaRegistrado?: boolean
  /** El nombre lo tomó otro jugador antes de poder registrar este perfil */
  tieneConflictoNombre?: boolean
  /** Token secreto con el que este dispositivo se identifica ante el servidor (sección 4.3) */
  tokenAutenticacion?: string
  /** El perfil quedó protegido por otro dispositivo: hay que recuperarlo con el código secreto */
  esRecuperacionNecesaria?: boolean
  /** Código secreto para recuperar el perfil en otro dispositivo */
  codigoRecuperacion?: string
  /** El jugador ya vio el aviso para guardar su código */
  esCodigoRecuperacionVisto?: boolean
}

/** `rejected`: el servidor no aceptó la partida; se conserva solo en este dispositivo */
export type EstadoSync = 'pending' | 'synced' | 'rejected'

export interface Partida {
  id: string
  jugadorId: string
  juego: IdJuego
  resultado: 'win' | 'loss' | 'draw' | 'completed'
  duracionMs: number
  xpObtenida: number
  /** No existe en las partidas guardadas antes de la etapa 4 */
  bitsObtenidos?: number
  resumen: string
  /** Datos específicos del juego; se guardan en `game_details` */
  detalles?: Record<string, unknown>
  jugadaEn: string
  estadoSincronizacion: EstadoSync
  /** Motivo del rechazo del servidor */
  errorSincronizacion?: string
}

export interface Ajustes {
  estaMusicaActiva: boolean
  estaSonidoActivo: boolean
  esMovimientoReducido: boolean
  esCronometroVisible: boolean
}
