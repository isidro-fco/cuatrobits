/**
 * Archivo: progresion.ts
 * Módulo: frontend / utils
 * Descripción: Módulo compartido de niveles (sección 9.2): la tabla puede ajustarse aquí sin tocar
 *              los juegos.
 * Requerimientos: RF47, RNF14
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Tipos ----------
// ---------- Tipos ----------
export interface ProgresoNivel {
  nivel: number
  /** XP acumulada dentro del nivel actual */
  xpEnNivel: number
  /** XP necesaria para subir al siguiente nivel */
  requerido: number
}

// ---------- Funciones ----------
// ---------- Funciones ----------
/**
 * XP necesaria para pasar del nivel `nivel` al siguiente
 * @param nivel Nivel actual del jugador
 * @returns XP necesaria
 * @see RF47, RNF14
 */
export function xpParaSiguienteNivel(nivel: number): number {
  return 100 + (nivel - 1) * 50
}

/**
 * Calcula el nivel y el avance hacia el siguiente a partir de la experiencia total.
 * @param xpTotal Experiencia acumulada del jugador
 * @returns Nivel, XP dentro del nivel y XP necesaria
 * @see RF47
 */
export function calcularNivel(xpTotal: number): ProgresoNivel {
  let nivel = 1
  let restantes = Math.max(0, Math.floor(xpTotal))
  while (restantes >= xpParaSiguienteNivel(nivel)) {
    restantes -= xpParaSiguienteNivel(nivel)
    nivel++
  }
  return { nivel, xpEnNivel: restantes, requerido: xpParaSiguienteNivel(nivel) }
}
