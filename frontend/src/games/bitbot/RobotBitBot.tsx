/**
 * Archivo: RobotBitBot.tsx
 * Módulo: frontend / games / bitbot
 * Descripción: Robot BitBot en pixel art que se ensambla pieza por pieza.
 * Requerimientos: RF28, RIU12
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Módulos internos ----------
import { TOTAL_PIEZAS } from './logicaBitBot'

// ---------- Tipos ----------
type Rectangulo = [columna: number, fila: number, ancho: number, alto: number, color: string]

interface Pieza {
  nombre: string
  rectangulos: Rectangulo[]
}

interface PropsRobotBitBot {
  ensambladas: number
  estaCelebrando?: boolean
  /** Color del cuerpo elegido en el taller de BitBot */
  color?: string
}

// ---------- Constantes ----------
/** Color del cuerpo cuando el jugador no eligió otro */
const AZUL = '#1a6be8'
/** Color azul marino del contorno y los detalles del robot */
const AZUL_MARINO = '#14295c'
/** Color blanco del robot */
const BLANCO = '#ffffff'
/** Color amarillo de los detalles del robot */
const AMARILLO = '#ffd35c'

// Ocho piezas en el orden en que se ensamblan (sección 6.4)
const PIEZAS: Pieza[] = [
  {
    nombre: 'cuerpo',
    rectangulos: [
      [6, 13, 12, 8, AZUL],
      [9, 15, 6, 3, BLANCO],
      [11, 16, 2, 1, AMARILLO],
    ],
  },
  {
    nombre: 'pierna izquierda',
    rectangulos: [
      [7, 21, 3, 4, AZUL_MARINO],
      [6, 25, 5, 2, AZUL],
    ],
  },
  {
    nombre: 'pierna derecha',
    rectangulos: [
      [14, 21, 3, 4, AZUL_MARINO],
      [13, 25, 5, 2, AZUL],
    ],
  },
  {
    nombre: 'cabeza',
    rectangulos: [
      [5, 4, 14, 8, AZUL],
      [11, 12, 2, 1, AZUL_MARINO],
    ],
  },
  {
    nombre: 'brazo izquierdo',
    rectangulos: [
      [3, 14, 3, 6, AZUL],
      [2, 20, 3, 2, AZUL_MARINO],
    ],
  },
  {
    nombre: 'brazo derecho',
    rectangulos: [
      [18, 14, 3, 6, AZUL],
      [19, 20, 3, 2, AZUL_MARINO],
    ],
  },
  {
    nombre: 'cara',
    rectangulos: [
      [7, 6, 10, 4, BLANCO],
      [9, 7, 2, 2, AZUL_MARINO],
      [13, 7, 2, 2, AZUL_MARINO],
    ],
  },
  {
    nombre: 'antena',
    rectangulos: [
      [11, 1, 2, 3, AZUL_MARINO],
      [10, 0, 4, 2, AMARILLO],
    ],
  },
]

// ---------- Componente RobotBitBot ----------
if (PIEZAS.length !== TOTAL_PIEZAS) {
  throw new Error('BitBot debe tener ocho piezas')
}

/**
 * Robot BitBot en pixel art que se ensambla pieza por pieza.
 * @param props Propiedades del componente
 * @param props.ensambladas Piezas ensambladas (3 a 8)
 * @param props.estaCelebrando Verdadero para la animación de victoria
 * @param props.color Color del cuerpo elegido en el Taller
 * @returns Imagen SVG del robot
 * @see RF28, RIU12
 */
export function RobotBitBot({
  ensambladas,
  estaCelebrando = false,
  color: cuerpo = AZUL,
}: PropsRobotBitBot) {
  return (
    <figure className="bitbot-robot" data-celebrating={estaCelebrando}>
      <svg
        viewBox="-1 -1 26 30"
        role="img"
        aria-label={`BitBot con ${ensambladas} de ${TOTAL_PIEZAS} piezas`}
      >
        {PIEZAS.map((pieza, i) => {
          const estaTerminado = i < ensambladas
          return (
            <g
              key={pieza.nombre}
              className={estaTerminado ? 'bitbot-robot__piece is-done' : 'bitbot-robot__piece'}
            >
              {pieza.rectangulos.map(([posicionX, posicionY, ancho, alto, color], j) => (
                <rect
                  key={j}
                  x={posicionX}
                  y={posicionY}
                  width={ancho}
                  height={alto}
                  fill={estaTerminado ? (color === AZUL ? cuerpo : color) : 'none'}
                  stroke={estaTerminado ? 'none' : '#9fb0c4'}
                  strokeWidth={estaTerminado ? 0 : 0.35}
                  strokeDasharray={estaTerminado ? undefined : '0.8 0.6'}
                />
              ))}
            </g>
          )
        })}
      </svg>
      <figcaption>
        Piezas: <strong>{ensambladas}</strong> / {TOTAL_PIEZAS}
      </figcaption>
    </figure>
  )
}
