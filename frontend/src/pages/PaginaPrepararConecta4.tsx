/**
 * Archivo: PaginaPrepararConecta4.tsx
 * Módulo: frontend / pages
 * Descripción: Pantalla previa de Conecta 4: modo de juego, dificultad y nombres.
 * Requerimientos: RF17, RF18
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { useState } from 'react'
import { useNavigate } from 'react-router'

// ---------- Módulos internos ----------
import { BotonRegresar } from '../components/BotonRegresar'
import { IconoFlechaDerecha, IconoUsuario, IconoUsuarios } from '../components/iconos'
import { MarcoPagina } from '../components/MarcoPagina'
import type { DificultadIA } from '../games/conecta4/iaMinimax'
import { NOMBRES_DIFICULTAD_IA, rutaConecta4 } from '../games/conecta4/configuracionConecta4'

// ---------- Constantes ----------
/** Dificultades de la IA con su descripción y color */
const DIFICULTADES: { id: DificultadIA; descripcion: string; color: string }[] = [
  { id: 'easy', descripcion: 'BitBot aún está aprendiendo', color: 'var(--mint)' },
  { id: 'normal', descripcion: 'Gana y bloquea cuando puede', color: 'var(--blue)' },
  { id: 'hard', descripcion: 'Piensa varias jugadas adelante', color: 'var(--orange)' },
]

// ---------- Componente PaginaPrepararConecta4 ----------
// Modo de juego y dificultad de la IA (sección 5.2)
/**
 * Pantalla previa de Conecta 4: modo de juego, dificultad de la IA y nombres.
 * @returns Pantalla de preparación
 * @see RF17, RF18
 */
export function PaginaPrepararConecta4() {
  const navegar = useNavigate()
  // Contra la IA o dos jugadores en el mismo dispositivo
  const [modo, asignarModo] = useState<'ai' | 'local'>('ai')
  // Dificultad de la IA elegida
  const [dificultad, asignarDificultad] = useState<DificultadIA>('normal')

  function iniciarPartida() {
    navegar(rutaConecta4(modo === 'ai' ? { modo, dificultad } : { modo }))
  }

  return (
    <MarcoPagina acciones={<BotonRegresar />} ancho="medium">
      <div className="page-title">
        <h1>¡Preparemos Conecta 4!</h1>
        <p>Elige contra quién quieres jugar</p>
      </div>

      <div className="card setup">
        <h2 className="section-heading">
          <span className="step-badge">1</span>
          Modo de juego
        </h2>
        <div className="game-tabs">
          <button
            type="button"
            className="choice game-tab"
            aria-pressed={modo === 'ai'}
            onClick={() => asignarModo('ai')}
          >
            <span className="mode-icon" aria-hidden>
              <IconoUsuario />
            </span>
            <span>
              Contra BitBot
              <span className="choice__sub">Juega contra la computadora</span>
            </span>
          </button>
          <button
            type="button"
            className="choice game-tab"
            aria-pressed={modo === 'local'}
            onClick={() => asignarModo('local')}
          >
            <span className="mode-icon" aria-hidden>
              <IconoUsuarios />
            </span>
            <span>
              Dos jugadores
              <span className="choice__sub">Por turnos en este dispositivo</span>
            </span>
          </button>
        </div>

        {modo === 'ai' && (
          <>
            <h2 className="section-heading">
              <span className="step-badge">2</span>
              Dificultad de BitBot
            </h2>
            <div className="difficulty-grid">
              {DIFICULTADES.map((dificultadActual, i) => (
                <button
                  key={dificultadActual.id}
                  type="button"
                  className="choice"
                  aria-pressed={dificultad === dificultadActual.id}
                  onClick={() => asignarDificultad(dificultadActual.id)}
                >
                  <span
                    className="difficulty-number"
                    style={{
                      background: dificultadActual.color,
                      color: dificultadActual.color === 'var(--blue)' ? '#fff' : undefined,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span>
                    {NOMBRES_DIFICULTAD_IA[dificultadActual.id]}
                    <span className="choice__sub">{dificultadActual.descripcion}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="setup__footer">
          <button type="button" className="btn btn--primary setup__start" onClick={iniciarPartida}>
            ¡Comenzar partida!
            <IconoFlechaDerecha />
          </button>
          <p>Conecta cuatro fichas en línea para ganar</p>
        </div>
      </div>
    </MarcoPagina>
  )
}
