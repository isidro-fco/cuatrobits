/**
 * Archivo: PaginaPrepararJuego.tsx
 * Módulo: frontend / pages
 * Descripción: Pantalla previa de Arma a BitBot y Memorama: categoría y dificultad.
 * Requerimientos: RF24, RF39, RIU05, RIU12
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'

// ---------- Módulos internos ----------
import { BotonRegresar } from '../components/BotonRegresar'
import { IconoPixel } from '../components/IconoPixel'
import { IconoFlechaDerecha, IconoPalomita } from '../components/iconos'
import { MarcoPagina } from '../components/MarcoPagina'
import { DIFICULTADES_BITBOT, CATEGORIAS, DIFICULTADES_MEMORAMA } from '../data/categorias'
import type { IdCategoria } from '../types'

// ---------- Tipos ----------
type JuegoConPreparacion = 'bitbot' | 'memory'

// ---------- Constantes ----------
/** Nombre visible de los juegos que tienen esta pantalla previa */
const NOMBRES_JUEGOS: Record<JuegoConPreparacion, string> = {
  bitbot: 'Arma a BitBot',
  memory: 'Memorama',
}

// ---------- Componente PaginaPrepararJuego ----------
function esJuegoConPreparacion(valor: string | undefined): valor is JuegoConPreparacion {
  return valor === 'bitbot' || valor === 'memory'
}

// Selección de categoría y dificultad para Arma a BitBot y Memorama (sección 11)
/**
 * Pantalla previa de Arma a BitBot y Memorama: categoría y dificultad.
 * @returns Pantalla de preparación
 * @see RF24, RF39, RIU05, RIU12
 */
export function PaginaPrepararJuego() {
  const parametros = useParams()
  if (!esJuegoConPreparacion(parametros.juego)) {
    return <Navigate to="/" replace />
  }
  return <PreparacionJuego key={parametros.juego} juego={parametros.juego} />
}

function PreparacionJuego({ juego }: { juego: JuegoConPreparacion }) {
  const navegar = useNavigate()
  const dificultades = juego === 'bitbot' ? DIFICULTADES_BITBOT : DIFICULTADES_MEMORAMA
  // Dificultad elegida
  const [dificultad, asignarDificultad] = useState<string>(dificultades[0].id)
  // Categoría elegida, o null si falta elegirla
  const [categoria, asignarCategoria] = useState<IdCategoria | null>(null)

  // En BitBot cada dificultad tiene sus propias categorías (sección 6.2)
  const esCategoriaHabilitada = (opcion: (typeof CATEGORIAS)[number]) =>
    juego === 'memory' || opcion.dificultadBitBot === dificultad

  function elegirDificultad(id: string) {
    asignarDificultad(id)
    if (
      juego === 'bitbot' &&
      categoria &&
      CATEGORIAS.find((opcion) => opcion.id === categoria)?.dificultadBitBot !== id
    ) {
      asignarCategoria(null)
    }
  }

  function iniciarPartida() {
    if (!categoria) {
      return
    }
    navegar(`/juego/${juego}?categoria=${categoria}&dificultad=${dificultad}`)
  }

  const pasoDificultad = (
    <>
      <h2 className="section-heading">
        <span className="step-badge">{juego === 'bitbot' ? 1 : 2}</span>
        Elige la dificultad
      </h2>
      <div className={`difficulty-grid difficulty-grid--${dificultades.length}`}>
        {dificultades.map((dificultadActual, i) => (
          <button
            key={dificultadActual.id}
            type="button"
            className="choice"
            aria-pressed={dificultad === dificultadActual.id}
            onClick={() => elegirDificultad(dificultadActual.id)}
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
              {dificultadActual.nombre}
              <span className="choice__sub">{dificultadActual.descripcion}</span>
            </span>
          </button>
        ))}
      </div>
    </>
  )

  const pasoCategoria = (
    <>
      <h2 className="section-heading">
        <span className="step-badge">{juego === 'bitbot' ? 2 : 1}</span>
        Elige una categoría
      </h2>
      <div className="category-grid">
        {CATEGORIAS.map((opcion) => {
          const estaHabilitado = esCategoriaHabilitada(opcion)
          return (
            <button
              key={opcion.id}
              type="button"
              className="choice"
              style={{ background: categoria === opcion.id ? undefined : opcion.fondo }}
              aria-pressed={categoria === opcion.id}
              disabled={!estaHabilitado}
              onClick={() => asignarCategoria(opcion.id)}
            >
              <span className="category-emoji" aria-hidden>
                <IconoPixel emoji={opcion.emoji} tamano={32} />
              </span>
              {opcion.nombre}
              {categoria === opcion.id && (
                <span className="choice__check">
                  <IconoPalomita />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </>
  )

  return (
    <MarcoPagina acciones={<BotonRegresar />} ancho="medium">
      <div className="page-title">
        <h1>¡Preparemos {NOMBRES_JUEGOS[juego]}!</h1>
        <p>Escoge una categoría y elige tu desafío</p>
      </div>

      <div className="card setup">
        {juego === 'bitbot' ? (
          <>
            {pasoDificultad}
            {pasoCategoria}
          </>
        ) : (
          <>
            {pasoCategoria}
            {pasoDificultad}
          </>
        )}

        <div className="setup__footer">
          <button
            type="button"
            className="btn btn--primary setup__start"
            disabled={!categoria}
            onClick={iniciarPartida}
          >
            ¡Comenzar partida!
            <IconoFlechaDerecha />
          </button>
          <p>
            {categoria
              ? '¡Tu próxima aventura comienza aquí!'
              : 'Elige una categoría para comenzar'}
          </p>
        </div>
      </div>
    </MarcoPagina>
  )
}
