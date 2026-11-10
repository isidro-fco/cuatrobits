/**
 * Archivo: PaginaPrepararEsferas.tsx
 * Módulo: frontend / pages
 * Descripción: Pantalla previa de Ordenamiento de esferas: cantidad de colores.
 * Requerimientos: RF31, RIU06
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router'

// ---------- Módulos internos ----------
import { BotonRegresar } from '../components/BotonRegresar'
import { IconoFlechaDerecha } from '../components/iconos'
import { MarcoPagina } from '../components/MarcoPagina'
import { EsferaPixel } from '../components/EsferaPixel'
import {
  MAX_COLORES,
  MIN_COLORES,
  COLORES_ESFERAS,
  ESFERAS_POR_COLOR,
  calcularTubos,
} from '../data/esferas'

// ---------- Componente PaginaPrepararEsferas ----------
/**
 * Pantalla previa de Ordenamiento de esferas: cantidad de colores.
 * @returns Pantalla de preparación
 * @see RF31, RIU06
 */
export function PaginaPrepararEsferas() {
  const navegar = useNavigate()
  // Cantidad de colores elegida (1 a 10)
  const [colores, asignarColores] = useState(4)
  const tubos = calcularTubos(colores)

  // Vista previa ilustrativa: el nivel real lo crea `generarNivel` al comenzar
  const vistaPrevia = Array.from({ length: tubos }, (_, indice) =>
    indice < colores
      ? Array.from({ length: ESFERAS_POR_COLOR }, (_, i) => (indice + i * 3) % colores)
      : [],
  )

  return (
    <MarcoPagina acciones={<BotonRegresar />} ancho="medium">
      <div className="page-title">
        <h1>¡Ordena las esferas!</h1>
        <p>Elige cuántos colores quieres organizar. ¡Tú decides el reto!</p>
      </div>

      <div className="card setup">
        <div className="sphere-setup__head">
          <div>
            <h2 className="sphere-setup__title">
              <label htmlFor="color-count">¿Cuántos colores quieres ordenar?</label>
            </h2>
            <p className="sphere-setup__sub">
              Selecciona una cantidad del {MIN_COLORES} al {MAX_COLORES}
            </p>
          </div>
          <output htmlFor="color-count" className="color-count">
            <strong>{colores}</strong>
            {colores === 1 ? 'color' : 'colores'}
          </output>
        </div>

        <input
          id="color-count"
          type="range"
          className="range"
          min={MIN_COLORES}
          max={MAX_COLORES}
          value={colores}
          onChange={(evento) => asignarColores(Number(evento.target.value))}
          style={
            {
              '--fill': `${((colores - MIN_COLORES) / (MAX_COLORES - MIN_COLORES)) * 100}%`,
            } as CSSProperties
          }
        />
        <div className="color-scale">
          {COLORES_ESFERAS.map((color, i) => (
            <button
              key={color}
              type="button"
              className={`color-scale__item ${i < colores ? 'is-active' : ''}`}
              onClick={() => asignarColores(i + 1)}
              aria-label={`${i + 1} ${i === 0 ? 'color' : 'colores'}`}
            >
              <EsferaPixel color={i} className="color-scale__sphere" />
              {i + 1}
            </button>
          ))}
        </div>

        <div className="sphere-setup__preview-head">
          <div>
            <h2 className="sphere-setup__title">Así será tu nivel</h2>
            <p className="sphere-setup__sub">Una vista previa de tu desafío</p>
          </div>
          <div className="sphere-setup__pills">
            <span className="pill pill--blue">
              {colores} {colores === 1 ? 'color' : 'colores'}
            </span>
            <span className="pill pill--mint">{tubos} tubos</span>
          </div>
        </div>
        <div className="tube-preview" aria-hidden>
          {vistaPrevia.map((esferas, indice) => (
            <span key={indice} className="tube">
              {esferas.map((color, i) => (
                <span key={i} className="ball">
                  <EsferaPixel color={color} />
                </span>
              ))}
            </span>
          ))}
        </div>

        <div className="setup__footer">
          <button
            type="button"
            className="btn btn--success setup__start"
            onClick={() => navegar(`/juego/ball-sort?colores=${colores}`)}
          >
            ¡Comenzar nivel!
            <IconoFlechaDerecha />
          </button>
        </div>
      </div>
    </MarcoPagina>
  )
}
