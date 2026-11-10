/**
 * Archivo: cronometro.ts
 * Módulo: frontend / utils
 * Descripción: Cronómetro que se puede pausar; mide con performance.now().
 * Requerimientos: RF37, RF44
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Funciones ----------
/**
 * Cronómetro que se puede pausar; mide con performance.now().
 * @see RF37, RF44
 */
export class Cronometro {
  /** Milisegundos medidos antes de la última pausa */
  private acumulado = 0
  /** Momento (performance.now) en que se reanudó; null mientras está en pausa */
  private iniciadaEn: number | null = null

  /**
   * Empieza o reanuda la medición; no hace nada si ya está corriendo.
   * @see RF37, RF44
   */
  iniciar() {
    if (this.iniciadaEn === null) {
      this.iniciadaEn = performance.now()
    }
  }

  /**
   * Detiene la medición y guarda lo transcurrido.
   * @see RF37, RF44, RIU09
   */
  pausar() {
    if (this.iniciadaEn === null) {
      return
    }
    this.acumulado += performance.now() - this.iniciadaEn
    this.iniciadaEn = null
  }

  /**
   * Indica si el cronómetro está midiendo.
   * @returns true si no está en pausa
   * @see RF37
   */
  get estaCorriendo(): boolean {
    return this.iniciadaEn !== null
  }

  /**
   * Tiempo medido hasta ahora.
   * @returns Milisegundos transcurridos sin contar las pausas
   * @see RF37, RF44
   */
  transcurrido(): number {
    return this.acumulado + (this.iniciadaEn === null ? 0 : performance.now() - this.iniciadaEn)
  }
}
