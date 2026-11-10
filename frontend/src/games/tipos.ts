/**
 * Archivo: tipos.ts
 * Módulo: frontend / games
 * Descripción: Tipos comunes de los minijuegos: estadísticas, desenlace y propiedades del
 *              componente de juego.
 * Requerimientos: RNF10, RF53
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import type { Partida } from '../types'

// ---------- Tipos ----------
export interface EstadisticaPartida {
  etiqueta: string
  valor: string | number
}

/** Lo que un minijuego informa al terminar la partida */
export interface DesenlacePartida {
  resultado: Partida['resultado']
  /** Texto breve para el historial */
  resumen: string
  /** Estadísticas que se muestran en la pantalla de resultados */
  estadisticas: EstadisticaPartida[]
  /** Datos específicos del juego que se registran (secciones 5.7, 6.6, 7.7 y 8.7) */
  detalles: Record<string, unknown>
  /** Mensaje adicional en los resultados, por ejemplo quién ganó */
  mensaje?: string
}

export interface PropsJuego<Configuracion> {
  configuracion: Configuracion
  /** Verdadero mientras el menú de pausa está abierto */
  estaPausado: boolean
  /** Se llama una sola vez, cuando termina la partida */
  alFinalizar: (desenlace: DesenlacePartida) => void
}
