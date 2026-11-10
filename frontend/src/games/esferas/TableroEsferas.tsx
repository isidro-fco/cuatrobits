/**
 * Archivo: TableroEsferas.tsx
 * Módulo: frontend / games / esferas
 * Descripción: Pantalla de juego de Ordenamiento de esferas: tubos, movimientos, deshacer y
 *              reinicio.
 * Requerimientos: RF33, RF34, RF35, RF37, RF38
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { useState } from 'react'

// ---------- Módulos internos ----------
import { NOMBRES_ESFERAS, SIMBOLOS_ESFERAS } from '../../data/esferas'
import { IconoReiniciar, IconoMezclar } from '../../components/iconos'
import { GlifoPixel } from '../../components/GlifoPixel'
import { EsferaPixel } from '../../components/EsferaPixel'
import { reproducirEfecto } from '../../services/audio'
import type { PropsJuego } from '../tipos'
import type { ConfiguracionEsferas } from './configuracionEsferas'
import {
  esPosibleMover,
  CAPACIDAD_MAXIMA,
  tubosCompletos,
  generarNivel,
  estaResuelto,
  moverEsfera,
  type Tubos,
} from './logicaEsferas'

// ---------- Componente TableroEsferas ----------
/**
 * Pantalla de juego de Ordenamiento de esferas: tubos, movimientos, deshacer y reinicio.
 * @param props Propiedades del componente
 * @param props.configuracion Configuración de la partida leída de la URL
 * @param props.alFinalizar Función que recibe el desenlace al terminar la partida
 * @returns Área de juego con los tubos y los controles
 * @see RF33, RF34, RF35, RF37, RF38
 */
export function TableroEsferas({ configuracion, alFinalizar }: PropsJuego<ConfiguracionEsferas>) {
  // Nivel inicial, para reiniciarlo sin generar otro
  const [inicial, asignarInicial] = useState(() => generarNivel(configuracion.colores))
  // Contenido actual de los tubos
  const [tubos, asignarTubos] = useState<Tubos>(inicial)
  // Estados anteriores, para deshacer (RF37)
  const [historial, asignarHistorial] = useState<Tubos[]>([])
  // Tubo del que se tomó una esfera, o null
  const [seleccionado, asignarSeleccionado] = useState<number | null>(null)
  // Último tubo que rechazó una esfera, para sacudirlo
  const [rechazo, asignarRechazo] = useState<{ tubo: number; contador: number } | null>(null)
  // Último tubo que recibió una esfera, para animarla
  const [ultimoDestino, asignarUltimoDestino] = useState<number | null>(null)
  const esNivelResuelto = estaResuelto(tubos)

  function rechazar(tubo: number) {
    reproducirEfecto('invalid')
    asignarRechazo((previo) => ({ tubo, contador: (previo?.contador ?? 0) + 1 }))
  }

  function seleccionarTubo(indice: number) {
    if (esNivelResuelto) {
      return
    }
    if (seleccionado === null) {
      if (tubos[indice].length === 0) {
        rechazar(indice)
      } else {
        asignarSeleccionado(indice)
        reproducirEfecto('select')
      }
      return
    }
    if (seleccionado === indice) {
      asignarSeleccionado(null)
      return
    }
    if (!esPosibleMover(tubos, seleccionado, indice)) {
      rechazar(indice)
      asignarSeleccionado(null)
      return
    }

    const siguiente = moverEsfera(tubos, seleccionado, indice)
    const movimientos = historial.length + 1
    asignarHistorial([...historial, tubos])
    asignarTubos(siguiente)
    asignarSeleccionado(null)
    asignarUltimoDestino(indice)
    reproducirEfecto('drop')
    if (estaResuelto(siguiente)) {
      alFinalizar({
        resultado: 'completed',
        resumen:
          `${configuracion.colores} ` +
          `${configuracion.colores === 1 ? 'color' : 'colores'} · ${movimientos} movimientos`,
        estadisticas: [
          { etiqueta: 'Movimientos', valor: movimientos },
          { etiqueta: 'Colores', valor: configuracion.colores },
        ],
        mensaje: '¡Todas las esferas están ordenadas!',
        detalles: { colores: configuracion.colores, movimientos, estaCompletada: true },
      })
    }
  }

  function deshacer() {
    if (historial.length === 0 || esNivelResuelto) {
      return
    }
    asignarTubos(historial[historial.length - 1])
    asignarHistorial(historial.slice(0, -1))
    asignarSeleccionado(null)
    reproducirEfecto('select')
    asignarUltimoDestino(null)
  }

  function reiniciarNivel(nivel: Tubos = inicial) {
    asignarTubos(nivel)
    asignarHistorial([])
    asignarSeleccionado(null)
    asignarUltimoDestino(null)
  }

  /** Otro nivel con los mismos colores, también con solución verificada */
  function nuevoNivel() {
    const nivel = generarNivel(configuracion.colores)
    asignarInicial(nivel)
    reiniciarNivel(nivel)
    reproducirEfecto('select')
  }

  return (
    <div className="ball-sort">
      <div className="game-toolbar">
        <span className="pill pill--blue">Movimientos: {historial.length}</span>
        <span className="pill pill--mint">
          Tubos completos: {tubosCompletos(tubos)} / {configuracion.colores}
        </span>
        <span className="game-toolbar__spacer" />
        <div className="ball-sort__actions">
          <button
            type="button"
            className="btn btn--outline btn--small"
            onClick={deshacer}
            disabled={historial.length === 0 || esNivelResuelto}
          >
            <GlifoPixel nombre="undo" />
            Deshacer
          </button>
          <button
            type="button"
            className="btn btn--outline btn--small"
            onClick={() => reiniciarNivel()}
            disabled={esNivelResuelto}
          >
            <IconoReiniciar />
            Reiniciar nivel
          </button>
          <button
            type="button"
            className="btn btn--outline btn--small"
            onClick={nuevoNivel}
            disabled={esNivelResuelto}
          >
            <IconoMezclar />
            Nuevas esferas
          </button>
        </div>
      </div>

      <p className="game-status" role="status">
        {esNivelResuelto
          ? '¡Nivel completado!'
          : seleccionado === null
            ? 'Toca un tubo para tomar la esfera de arriba'
            : `Tomaste una esfera ${NOMBRES_ESFERAS[tubos[seleccionado].at(-1)!]}. Ahora ` +
              `toca otro tubo.`}
      </p>

      <div className="ball-sort__tubes" data-solved={esNivelResuelto}>
        {tubos.map((tubo, indice) => {
          const estaLleno =
            tubo.length === CAPACIDAD_MAXIMA && tubo.every((esfera) => esfera === tubo[0])
          // Colores del tubo para los lectores de pantalla (RNF03)
          const contenido =
            tubo.length === 0 ? 'vacío' : tubo.map((esfera) => NOMBRES_ESFERAS[esfera]).join(', ')
          return (
            <button
              key={indice}
              type="button"
              className="tube tube--game"
              data-selected={seleccionado === indice}
              data-complete={estaLleno}
              aria-pressed={seleccionado === indice}
              aria-label={`Tubo ${indice + 1}: ${contenido}`}
              onClick={() => seleccionarTubo(indice)}
            >
              {/* La clave cambia con cada rechazo para reiniciar la animación */}
              <span
                key={rechazo?.tubo === indice ? rechazo.contador : 0}
                className={rechazo?.tubo === indice ? 'tube__inner is-rejected' : 'tube__inner'}
              >
                {tubo.map((color, i) => {
                  const esSuperior = i === tubo.length - 1
                  // La esfera superior se levanta al seleccionarla y cae al llegar a su tubo
                  const estaLevantada = esSuperior && seleccionado === indice
                  const estaCayendo = esSuperior && ultimoDestino === indice
                  return (
                    <span
                      key={i}
                      className={['ball', estaLevantada && 'is-lifted', estaCayendo && 'is-dropped']
                        .filter(Boolean)
                        .join(' ')}
                      aria-hidden
                    >
                      <EsferaPixel color={color} />
                      <GlifoPixel nombre={SIMBOLOS_ESFERAS[color]} className="ball__symbol" />
                    </span>
                  )
                })}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
