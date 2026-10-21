/** Cronómetro que se puede pausar; mide con `performance.now()` */
export class Stopwatch {
  private accumulated = 0
  private startedAt: number | null = null

  start() {
    if (this.startedAt === null) this.startedAt = performance.now()
  }

  pause() {
    if (this.startedAt === null) return
    this.accumulated += performance.now() - this.startedAt
    this.startedAt = null
  }

  get running(): boolean {
    return this.startedAt !== null
  }

  /** Milisegundos transcurridos sin contar las pausas */
  elapsed(): number {
    return this.accumulated + (this.startedAt === null ? 0 : performance.now() - this.startedAt)
  }
}
