/**
 * Archivo: CronometroJuego.tsx
 * Módulo: frontend / components
 * Descripción: Cronómetro opcional de las partidas; se actualiza por su cuenta para no volver a
 *              dibujar el tablero en cada tic.
 * Requerimientos: RF37, RF44, RIU11
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { useEffect, useState } from 'react'

// ---------- Módulos internos ----------
import type { Cronometro } from '../utils/cronometro'
import { GlifoPixel } from './GlifoPixel'
import { formatearDuracion } from '../utils/formato'

// ---------- Componente CronometroJuego ----------
/**
 * Cronómetro opcional de la partida; se actualiza por su cuenta para no volver a dibujar el tablero
 * en cada tic.
 * @param props Propiedades del componente
 * @param props.cronometro Cronómetro de la partida
 * @returns Tiempo transcurrido con formato mm:ss
 * @see RF37, RF44, RIU11
 */
export function CronometroJuego({ cronometro }: { cronometro: Cronometro }) {
  // Milisegundos que se muestran; se actualiza cuatro veces por segundo
  const [transcurrido, asignarTranscurrido] = useState(() => cronometro.transcurrido())

  useEffect(() => {
    const id = window.setInterval(() => asignarTranscurrido(cronometro.transcurrido()), 250)
    return () => window.clearInterval(id)
  }, [cronometro])

  return (
    <span className="pill pill--blue game-timer">
      <GlifoPixel nombre="timer" /> <span className="visually-hidden">Tiempo: </span>
      {formatearDuracion(transcurrido)}
    </span>
  )
}
