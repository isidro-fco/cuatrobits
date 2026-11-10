/**
 * Archivo: TableroConecta4.tsx
 * Módulo: frontend / games / conecta4
 * Descripción: Pantalla de juego de Conecta 4: tablero, turnos, IA y resaltado de la línea
 *              ganadora.
 * Requerimientos: RF12, RF13, RF14, RF15, RF17, RF18, RF21, RF22
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { useEffect, useEffectEvent, useState, type CSSProperties } from 'react'

// ---------- Módulos internos ----------
import { GlifoPixel } from '../../components/GlifoPixel'
import { EsferaPixel } from '../../components/EsferaPixel'
import { reproducirEfecto } from '../../services/audio'
import { useJugadorActivo } from '../../stores/useJugadorStore'
import type { PropsJuego } from '../tipos'
import { elegirMovimientoIA } from './iaMinimax'
import {
  NOMBRES_DIFICULTAD_IA,
  type ConfiguracionConecta4,
  SIMBOLOS_FICHAS,
  elegirColoresFichas,
} from './configuracionConecta4'
import {
  aplicarMovimiento,
  COLUMNAS,
  crearTablero,
  type Ficha,
  obtenerEstatus,
  type Posicion,
  FILAS,
} from './logicaConecta4'

// ---------- Constantes ----------
/** Espera antes de que la IA juegue, para que se vea la jugada anterior */
const RETRASO_IA_MS = 600

// Sombra de la ficha: su propio color oscurecido
const SOMBRA_FICHA = 'color-mix(in srgb, var(--disc), #14295c 30%)'

// ---------- Componente TableroConecta4 ----------
/**
 * Pantalla de juego de Conecta 4: tablero, turnos, IA y resaltado de la línea ganadora.
 * @param props Propiedades del componente
 * @param props.configuracion Configuración de la partida leída de la URL
 * @param props.estaPausado Verdadero mientras el menú de pausa está abierto
 * @param props.alFinalizar Función que recibe el desenlace al terminar la partida
 * @returns Área de juego con el tablero y los turnos
 * @see RF12, RF13, RF14, RF15, RF17, RF18, RF22
 */
export function TableroConecta4({
  configuracion,
  estaPausado,
  alFinalizar,
}: PropsJuego<ConfiguracionConecta4>) {
  const jugador = useJugadorActivo()
  // Colores de las fichas, elegidos al azar una vez por partida (RF16)
  const [colores] = useState(() => elegirColoresFichas())
  // Fichas colocadas en el tablero
  const [tablero, asignarTablero] = useState(crearTablero)
  // Participante que juega ahora
  const [turno, asignarTurno] = useState<Ficha>(0)
  // Fichas colocadas en la partida, para el registro (RF22)
  const [movimientos, asignarMovimientos] = useState(0)
  // Última ficha colocada, para animar su caída
  const [ultimoMovimiento, asignarUltimoMovimiento] = useState<Posicion | null>(null)

  const nombres = [
    jugador?.username ?? 'Jugador 1',
    configuracion.modo === 'ai' ? 'BitBot' : 'Jugador 2',
  ]
  const estatus = obtenerEstatus(tablero)
  const esTurnoIA = configuracion.modo === 'ai' && turno === 1
  const celdasGanadoras = new Set(
    estatus.tipo === 'win' ? estatus.win.celdas.map(([fila, columna]) => `${fila}-${columna}`) : [],
  )

  function jugar(columna: number) {
    if (estatus.tipo !== 'playing') {
      return
    }
    const { tablero: siguiente, fila } = aplicarMovimiento(tablero, columna, turno)
    const movimientosTotales = movimientos + 1
    asignarTablero(siguiente)
    asignarMovimientos(movimientosTotales)
    asignarUltimoMovimiento([fila, columna])
    asignarTurno((1 - turno) as Ficha)
    reproducirEfecto('drop')

    const fin = obtenerEstatus(siguiente)
    if (fin.tipo === 'playing') {
      return
    }
    const ganador = fin.tipo === 'win' ? nombres[fin.win.ganador] : null
    const nombreModo =
      configuracion.modo === 'ai'
        ? `Contra BitBot (${NOMBRES_DIFICULTAD_IA[configuracion.dificultad]})`
        : 'Dos jugadores'
    alFinalizar({
      resultado: fin.tipo === 'draw' ? 'draw' : fin.win.ganador === 0 ? 'win' : 'loss',
      resumen: `${nombreModo} · ${movimientosTotales} movimientos`,
      estadisticas: [
        { etiqueta: 'Movimientos', valor: movimientosTotales },
        configuracion.modo === 'ai'
          ? {
              etiqueta: 'Dificultad de BitBot',
              valor: NOMBRES_DIFICULTAD_IA[configuracion.dificultad],
            }
          : { etiqueta: 'Modo de juego', valor: '2 jugadores' },
      ],
      mensaje: ganador ? `¡Ganó ${ganador}!` : 'El tablero se llenó sin ganador.',
      detalles: {
        jugadores: nombres,
        modo: configuracion.modo,
        dificultad: configuracion.modo === 'ai' ? configuracion.dificultad : null,
        movimientos: movimientosTotales,
        ganador,
      },
    })
  }

  // Turno de la IA; el temporizador se reprograma al salir de la pausa
  const esMomentoDeIA = esTurnoIA && !estaPausado && estatus.tipo === 'playing'
  const jugarMovimientoIA = useEffectEvent(() => {
    if (configuracion.modo === 'ai') {
      jugar(elegirMovimientoIA(tablero, 1, configuracion.dificultad))
    }
  })
  useEffect(() => {
    if (!esMomentoDeIA) {
      return
    }
    const id = window.setTimeout(jugarMovimientoIA, RETRASO_IA_MS)
    return () => window.clearTimeout(id)
  }, [esMomentoDeIA])

  let statusText: string
  if (estatus.tipo === 'win') {
    statusText = `¡${nombres[estatus.win.ganador]} conectó cuatro!`
  } else if (estatus.tipo === 'draw') {
    statusText = '¡Empate! El tablero está lleno.'
  } else if (esTurnoIA) {
    statusText = 'BitBot está pensando…'
  } else {
    statusText = `Turno de ${nombres[turno]}`
  }

  return (
    <div className="c4">
      <div className="c4__players">
        {nombres.map((nombre, i) => (
          <div
            key={i}
            className="c4__player"
            data-active={estatus.tipo === 'playing' && turno === i}
            style={{ '--disc': colores[i].color, '--disc-ink': colores[i].tinta } as CSSProperties}
          >
            <span className="c4__disc c4__disc--small" aria-hidden>
              <EsferaPixel relleno="var(--disc)" sombra={SOMBRA_FICHA} />
              <GlifoPixel nombre={SIMBOLOS_FICHAS[i]} />
            </span>
            <span>
              <strong>{nombre}</strong>
              <span className="c4__player-sub">
                Ficha {colores[i].nombre} <GlifoPixel nombre={SIMBOLOS_FICHAS[i]} />
              </span>
            </span>
          </div>
        ))}
      </div>

      <p className="game-status" role="status">
        {statusText}
      </p>

      <div className="c4__frame">
        <div className="c4__board">
          {Array.from({ length: COLUMNAS }, (_, columna) => {
            const estaLleno = tablero[0][columna] !== null
            return (
              <button
                key={columna}
                type="button"
                className="c4__column"
                aria-label={`Columna ${columna + 1}${estaLleno ? ', llena' : ''}`}
                disabled={estaLleno || esTurnoIA || estatus.tipo !== 'playing'}
                onClick={() => jugar(columna)}
              >
                {Array.from({ length: FILAS }, (_, fila) => {
                  const celda = tablero[fila][columna]
                  const esUltimo = ultimoMovimiento?.[0] === fila && ultimoMovimiento[1] === columna
                  return (
                    <span key={fila} className="c4__cell">
                      {celda !== null && (
                        <span
                          className={
                            `c4__disc ${esUltimo ? 'c4__disc--drop' : ''} ` +
                            `${celdasGanadoras.has(`${fila}-${columna}`) ? 'c4__disc--win' : ''}`
                          }
                          style={
                            {
                              '--disc': colores[celda].color,
                              '--disc-ink': colores[celda].tinta,
                              '--drop-rows': fila + 1,
                            } as CSSProperties
                          }
                          aria-hidden
                        >
                          <EsferaPixel relleno="var(--disc)" sombra={SOMBRA_FICHA} />
                          <GlifoPixel nombre={SIMBOLOS_FICHAS[celda]} />
                        </span>
                      )}
                    </span>
                  )
                })}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
