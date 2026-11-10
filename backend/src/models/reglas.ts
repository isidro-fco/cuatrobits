/**
 * Archivo: reglas.ts
 * Módulo: backend / models
 * Descripción: Reglas de recompensas y niveles (secciones 9.1 y 9.2). Deben coincidir con
 *              frontend/src/utils/recompensas.ts y progresion.ts; una prueba lo comprueba.
 * Requerimientos: RF46, RF47, RF49, RNF14
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Tipos ----------
export type IdJuego = (typeof IDS_JUEGOS)[number]
export type ResultadoPartida = (typeof RESULTADOS_PARTIDA)[number]

// ---------- Constantes ----------
/** Identificadores de los cuatro minijuegos */
export const IDS_JUEGOS = ['connect-four', 'bitbot', 'ball-sort', 'memory'] as const

/** Resultados posibles de una partida */
export const RESULTADOS_PARTIDA = ['win', 'loss', 'draw', 'completed'] as const

/** Resultados posibles en cada juego */
export const RESULTADOS_POR_JUEGO: Record<IdJuego, readonly ResultadoPartida[]> = {
  'connect-four': ['win', 'loss', 'draw'],
  bitbot: ['win', 'loss'],
  'ball-sort': ['completed'],
  memory: ['completed'],
}

/** RF46: XP por terminar cualquier partida; perder no resta XP */
export const XP_PARTIDA_COMPLETADA = 10

/** XP adicional por ganar o completar cada juego (sección 9.1) */
export const XP_BONO: Record<IdJuego, number> = {
  'connect-four': 15,
  bitbot: 10,
  'ball-sort': 15,
  memory: 10,
}

/** Bits por terminar una partida y bono por ganarla o completarla (sección 9.4) */
export const BITS_COMPLETADA = 2
/** Bits adicionales por ganar o completar una partida */
export const BITS_EXITO = 3

// ---------- Funciones ----------
/**
 * Experiencia de una partida según la tabla de la sección 9.1; nunca resta experiencia.
 * @param juego Minijuego de la partida
 * @param resultado Resultado de la partida
 * @returns XP otorgada
 * @see RF46, RF60
 */
export function xpPorPartida(juego: IdJuego, resultado: ResultadoPartida): number {
  const esExitoso = resultado === 'win' || resultado === 'completed'
  return XP_PARTIDA_COMPLETADA + (esExitoso ? XP_BONO[juego] : 0)
}

/**
 * Bits de una partida: 2 por terminarla y 3 más por ganarla o completarla.
 * @param resultado Resultado de la partida
 * @returns Bits otorgados
 * @see RF49, RF60
 */
export function bitsPorPartida(resultado: ResultadoPartida): number {
  const esExitoso = resultado === 'win' || resultado === 'completed'
  return BITS_COMPLETADA + (esExitoso ? BITS_EXITO : 0)
}

/**
 * Experiencia necesaria para pasar del nivel indicado al siguiente.
 * @param nivel Nivel actual del jugador
 * @returns XP necesaria
 * @see RF47
 */
export function xpParaSiguienteNivel(nivel: number): number {
  return 100 + (nivel - 1) * 50
}

/**
 * Calcula el nivel a partir de la experiencia total.
 * @param xpTotal Experiencia acumulada del jugador
 * @returns Nivel del jugador
 * @see RF47
 */
export function calcularNivel(xpTotal: number): number {
  let nivel = 1
  let restantes = Math.max(0, Math.floor(xpTotal))
  while (restantes >= xpParaSiguienteNivel(nivel)) {
    restantes -= xpParaSiguienteNivel(nivel)
    nivel++
  }
  return nivel
}
