/**
 * Archivo: ArteIsla.tsx
 * Módulo: frontend / components
 * Descripción: Dibujo en pixel art de cada isla del lobby.
 * Requerimientos: RF05, RNF08, RNF09
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import type { IdJuego } from '../types'
import type { NombreGlifo } from '../data/glifosPixel'
import { GlifoPixel } from './GlifoPixel'
import { EsferaPixel } from './EsferaPixel'
import { SpritePixel } from './SpritePixel'
import { useSpriteBitBot } from '../hooks/useSpriteBitBot'

// ---------- Constantes ----------
/** Fichas dibujadas en la isla de Conecta 4: r roja, y amarilla, . hueco vacío */
const PATRON_CONECTA4 = ['r..r', 'y.r.', 'yr..', 'r..r']

// Círculo de pixel art de 14 × 14 (el mismo contorno que las esferas) para los huecos del tablero
const CIRCULO_PIXEL =
  '4,0 10,0 10,1 12,1 12,2 13,2 13,4 14,4 14,10 13,10 13,12 12,12 12,13 10,13 10,14 4,14 ' +
  '4,13 2,13 2,12 1,12 1,10 0,10 0,4 1,4 1,2 2,2 2,1 4,1'

// ---------- Componente ArteIsla ----------
/** Rectángulo con esquinas en escalón de `escalon` unidades */
function rectanguloEscalonado(
  posicionX: number,
  posicionY: number,
  ancho: number,
  alto: number,
  escalon: number,
) {
  const bordeDerecho = posicionX + ancho
  const bordeInferior = posicionY + alto
  return [
    [posicionX + 2 * escalon, posicionY],
    [bordeDerecho - 2 * escalon, posicionY],
    [bordeDerecho - 2 * escalon, posicionY + escalon],
    [bordeDerecho - escalon, posicionY + escalon],
    [bordeDerecho - escalon, posicionY + 2 * escalon],
    [bordeDerecho, posicionY + 2 * escalon],
    [bordeDerecho, bordeInferior - 2 * escalon],
    [bordeDerecho - escalon, bordeInferior - 2 * escalon],
    [bordeDerecho - escalon, bordeInferior - escalon],
    [bordeDerecho - 2 * escalon, bordeInferior - escalon],
    [bordeDerecho - 2 * escalon, bordeInferior],
    [posicionX + 2 * escalon, bordeInferior],
    [posicionX + 2 * escalon, bordeInferior - escalon],
    [posicionX + escalon, bordeInferior - escalon],
    [posicionX + escalon, bordeInferior - 2 * escalon],
    [posicionX, bordeInferior - 2 * escalon],
    [posicionX, posicionY + 2 * escalon],
    [posicionX + escalon, posicionY + 2 * escalon],
    [posicionX + escalon, posicionY + escalon],
    [posicionX + 2 * escalon, posicionY + escalon],
  ]
    .map((punto) => punto.join(','))
    .join(' ')
}

function ArteConecta4() {
  const coloresCelda = { r: '#ef5b5b', y: '#ffd35c', '.': '#eaf2ff' } as const
  return (
    <svg viewBox="0 0 100 100" className="island-art__svg">
      <polygon points={rectanguloEscalonado(4, 4, 92, 92, 4)} fill="#1a6be8" />
      {PATRON_CONECTA4.flatMap((fila, numeroFila) =>
        [...fila].map((caracter, numeroColumna) => (
          <svg
            key={`${numeroColumna}-${numeroFila}`}
            x={13 + numeroColumna * 20}
            y={13 + numeroFila * 20}
            width="14"
            height="14"
            viewBox="0 0 14 14"
          >
            <polygon
              points={CIRCULO_PIXEL}
              fill={coloresCelda[caracter as keyof typeof coloresCelda]}
            />
          </svg>
        )),
      )}
    </svg>
  )
}

function ArteEsferas() {
  const tubos = [
    [2, 1, 0],
    [3, 2, 1],
    [0, 3, 2],
    [1, 0, 3],
  ]
  return (
    <svg viewBox="0 0 100 100" className="island-art__svg">
      {tubos.map((esferas, indice) => (
        <g key={indice}>
          <polygon points={rectanguloEscalonado(8 + indice * 23, 10, 16, 80, 2)} fill="#6f8aa3" />
          <rect x={11 + indice * 23} y="13" width="10" height="74" fill="#fff" />
          {esferas.map((color, i) => (
            <EsferaPixel
              key={i}
              color={[2, 1, 0, 3][color]}
              x={9 + indice * 23}
              y={23 + i * 19}
              tamano={14}
            />
          ))}
        </g>
      ))}
    </svg>
  )
}

function ArteMemorama() {
  const cartas: NombreGlifo[] = ['star', 'question', 'question', 'question']
  return (
    <svg viewBox="0 0 100 100" className="island-art__svg">
      {cartas.map((etiqueta, i) => (
        <g key={i} transform={`translate(${6 + (i % 2) * 48} ${4 + Math.floor(i / 2) * 48})`}>
          <polygon points={rectanguloEscalonado(0, 0, 40, 44, 3)} fill="#c4520f" />
          <GlifoPixel nombre={etiqueta} x="11" y="13" tamano={18} color="#fff" />
        </g>
      ))}
    </svg>
  )
}

function ArteBitBot() {
  return (
    <span className="island-art__bitbot">
      <SpritePixel sprite={useSpriteBitBot()} tamano="100%" />
    </span>
  )
}

/**
 * Dibujo en pixel art de la isla de un minijuego.
 * @param props Propiedades del componente
 * @param props.juego Minijuego al que pertenece la isla
 * @returns Imagen SVG de la isla
 * @see RF05, RNF09
 */
export function ArteIsla({ juego }: { juego: IdJuego }) {
  return (
    <span className="island-art" aria-hidden>
      {juego === 'connect-four' && <ArteConecta4 />}
      {juego === 'bitbot' && <ArteBitBot />}
      {juego === 'ball-sort' && <ArteEsferas />}
      {juego === 'memory' && <ArteMemorama />}
    </span>
  )
}
