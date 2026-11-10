/**
 * Archivo: TableroMemorama.tsx
 * Módulo: frontend / games / memorama
 * Descripción: Pantalla de juego de Memorama: tablero de cartas, intentos y parejas encontradas.
 * Requerimientos: RF41, RF42, RF43, RF44, RF45
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { useEffect, useState, type CSSProperties } from 'react'

// ---------- Módulos internos ----------
import { GlifoPixel } from '../../components/GlifoPixel'
import { IconoPixel } from '../../components/IconoPixel'
import { CATEGORIAS, DIFICULTADES_MEMORAMA } from '../../data/categorias'
import { CONTENIDO } from '../../data/contenido'
import { useHistorialStore } from '../../stores/useHistorialStore'
import { useJugadorActivo } from '../../stores/useJugadorStore'
import { reproducirEfecto } from '../../services/audio'
import type { PropsJuego } from '../tipos'
import type { ConfiguracionMemorama } from './configuracionMemorama'
import {
  crearMazo,
  crearJuegoMemorama,
  voltearCarta,
  ocultarNoEmparejadas,
  estaCartaVolteada,
  estaBloqueada,
  estaMemoramaCompleto,
  cantidadParejas,
} from './logicaMemorama'
import { obtenerRecientes, recordarRecientes } from '../../utils/recientes'

// ---------- Constantes ----------
/** Tiempo que siguen visibles dos cartas que no coinciden (RF42) */
const RETRASO_OCULTAR_MS = 1000

// ---------- Componente TableroMemorama ----------
/** Menor número de intentos con el que el jugador completó esta dificultad */
function useMejoresIntentos(dificultad: string): number | null {
  const jugador = useJugadorActivo()
  const registros = useHistorialStore((estado) => estado.registros)
  const intentos = registros
    .filter(
      (registro) =>
        registro.jugadorId === jugador?.id &&
        registro.juego === 'memory' &&
        registro.detalles?.dificultad === dificultad,
    )
    .map((registro) => registro.detalles?.intentos)
    .filter((intentos): intentos is number => typeof intentos === 'number')
  return intentos.length > 0 ? Math.min(...intentos) : null
}

/**
 * Pantalla de juego de Memorama: tablero de cartas, intentos y parejas encontradas.
 * @param props Propiedades del componente
 * @param props.configuracion Configuración de la partida leída de la URL
 * @param props.alFinalizar Función que recibe el desenlace al terminar la partida
 * @returns Área de juego con el tablero de cartas
 * @see RF41, RF42, RF43, RF44
 */
export function TableroMemorama({ configuracion, alFinalizar }: PropsJuego<ConfiguracionMemorama>) {
  const dificultad = DIFICULTADES_MEMORAMA.find((opcion) => opcion.id === configuracion.dificultad)!
  const categoria = CATEGORIAS.find((opcion) => opcion.id === configuracion.categoria)!
  // Cartas, cartas volteadas, parejas e intentos
  const [estado, asignarEstado] = useState(() => {
    // Las imágenes de las últimas partidas se dejan al final para que no se repitan tan seguido
    const imagenes = CONTENIDO[configuracion.categoria].imagenes
    const parejas = (dificultad.columnas * dificultad.filas) / 2
    const lista = `memory:${configuracion.categoria}`
    const cartas = crearMazo(imagenes, parejas, Math.random, obtenerRecientes(lista))
    recordarRecientes(
      lista,
      cartas.map((carta) => carta.imagen.emoji),
      imagenes.length - parejas,
    )
    return crearJuegoMemorama(cartas)
  })
  const mejor = useMejoresIntentos(configuracion.dificultad)
  const parejas = cantidadParejas(estado)
  const estaCompleto = estaMemoramaCompleto(estado)

  // Las cartas que no coinciden se ocultan después de un momento
  const estaCerrado = estaBloqueada(estado)
  useEffect(() => {
    if (!estaCerrado) {
      return
    }
    const id = window.setTimeout(() => asignarEstado(ocultarNoEmparejadas), RETRASO_OCULTAR_MS)
    return () => window.clearTimeout(id)
  }, [estaCerrado])

  function voltear(indice: number) {
    const siguiente = voltearCarta(estado, indice)
    if (siguiente === estado) {
      return
    }
    asignarEstado(siguiente)
    if (siguiente.idsEmparejados.size > estado.idsEmparejados.size) {
      reproducirEfecto('match')
    } else if (estaBloqueada(siguiente)) {
      reproducirEfecto('wrong', 250)
    } else {
      reproducirEfecto('flip')
    }
    if (!estaMemoramaCompleto(siguiente)) {
      return
    }
    alFinalizar({
      resultado: 'completed',
      resumen: `${categoria.nombre} · ${dificultad.nombre} · ${siguiente.intentos} intentos`,
      estadisticas: [
        { etiqueta: 'Intentos', valor: siguiente.intentos },
        { etiqueta: 'Parejas', valor: parejas },
      ],
      mensaje:
        mejor === null || siguiente.intentos < mejor
          ? '¡Nuevo récord de intentos!'
          : `Tu récord es de ${mejor} intentos.`,
      detalles: {
        categoria: configuracion.categoria,
        dificultad: configuracion.dificultad,
        parejas,
        intentos: siguiente.intentos,
      },
    })
  }

  const ultimaVolteada = estado.volteadas.at(-1)
  let statusText = 'Voltea dos cartas para buscar una pareja'
  if (estaCompleto) {
    statusText = '¡Encontraste todas las parejas!'
  } else if (estaCerrado) {
    statusText = 'No son iguales. ¡Recuerda dónde están!'
  } else if (ultimaVolteada !== undefined) {
    statusText = `Volteaste: ${estado.cartas[ultimaVolteada].imagen.nombre}. Busca su pareja.`
  }

  return (
    <div className="memory">
      <div className="game-toolbar">
        <span className="pill pill--blue">
          <IconoPixel emoji={categoria.emoji} tamano={16} /> {categoria.nombre} ·{' '}
          {dificultad.nombre}
        </span>
        <span className="pill pill--mint">
          Parejas: {estado.idsEmparejados.size} / {parejas}
        </span>
        <span className="pill pill--yellow">Intentos: {estado.intentos}</span>
        {mejor !== null && <span className="pill pill--orange">Récord: {mejor}</span>}
      </div>

      <p className="game-status" role="status">
        {statusText}
      </p>

      <div className="memory__grid" style={{ '--cols': dificultad.columnas } as CSSProperties}>
        {estado.cartas.map((carta, i) => {
          const estaVolteada = estaCartaVolteada(estado, i)
          const estaEmparejada = estado.idsEmparejados.has(carta.idPareja)
          return (
            <button
              key={carta.id}
              type="button"
              className="memory-card"
              data-face-up={estaVolteada}
              data-matched={estaEmparejada}
              aria-label={
                estaVolteada
                  ? `${carta.imagen.nombre}${estaEmparejada ? ', pareja encontrada' : ''}`
                  : `Carta ${i + 1}, boca abajo`
              }
              disabled={estaEmparejada || estaCompleto}
              onClick={() => voltear(i)}
            >
              <span className="memory-card__inner" aria-hidden>
                <span className="memory-card__back">
                  <GlifoPixel nombre="star" />
                </span>
                <span className="memory-card__front">
                  <IconoPixel emoji={carta.imagen.emoji} tamano="62%" />
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
