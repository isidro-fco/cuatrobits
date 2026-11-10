/**
 * Archivo: PantallaInactividad.tsx
 * Módulo: frontend / components
 * Descripción: Protector de pantalla que aparece tras un tiempo sin actividad y se cierra al tocar
 *              o mover el puntero.
 * Requerimientos: RNF04, RNF07
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'

// ---------- Módulos internos ----------
import { useInactividad } from '../hooks/useInactividad'
import { Fondo } from './Fondo'
import { MarcaLogo } from './Logo'

// ---------- Tipos ----------
// Las claves son propiedades CSS: se usan como fotogramas de Web Animations y no se traducen
type Pose = { transform: string; scale: string; borderRadius: string; opacity: string }

// ---------- Constantes ----------
/** Tiempo sin actividad antes de mostrar el protector de pantalla */
export const INACTIVIDAD_MS = 30_000

/** Duración del regreso de las figuras a su lugar al despertar */
const REGRESO_MS = 3500
/** Espera antes de desvanecer el protector, para que se vea el regreso de las figuras */
const RETRASO_DESVANECER_MS = 3000
/** Fundido con el que reaparece la pantalla (las islas del lobby) */
const DESVANECER_MS = 800

/** Duración de la salida: las figuras vuelven a su lugar y después aparece la pantalla */
export const SALIDA_MS = RETRASO_DESVANECER_MS + DESVANECER_MS

/**
 * Distancia que debe moverse el puntero para despertar; evita que un movimiento sintético lo cierre
 * al abrirse
 */
const DISTANCIA_DESPERTAR = 12

/** Selector CSS de las figuras del fondo que se animan */
const FIGURAS = '.blob, .pixels, .pixels i'

// ---------- Componente PantallaInactividad ----------
function pose(elemento: Element): Pose {
  const estilos = getComputedStyle(elemento)
  return {
    transform: estilos.transform,
    scale: estilos.scale,
    borderRadius: estilos.borderRadius,
    opacity: estilos.opacity,
  }
}

/**
 * Protector de pantalla: tras 30 s sin actividad oculta la pantalla actual y muestra el fondo en
 * movimiento con el logotipo al centro. Al despertar, las figuras regresan suavemente a su lugar y
 * la pantalla reaparece con un fundido. No aparece durante las partidas.
 * @returns Protector de pantalla o nada mientras hay actividad
 * @see RNF04, RNF07
 */
export function PantallaInactividad() {
  const { pathname } = useLocation()
  const { estaInactivo, despertar } = useInactividad(
    INACTIVIDAD_MS,
    !pathname.startsWith('/juego/'),
  )
  // Verdadero mientras se anima la salida del protector
  const [estaSaliendo, asignarEstaSaliendo] = useState(false)
  const ref = useRef<HTMLDialogElement>(null)
  const origenPuntero = useRef<{ posicionX: number; posicionY: number } | null>(null)
  const congelado = useRef<Pose[]>([])
  const temporizador = useRef<number>(undefined)

  // <dialog> modal: queda por encima de cualquier ventana abierta y bloquea la pantalla de abajo
  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) {
      return
    }
    if (estaInactivo && !dialogo.open) {
      origenPuntero.current = null
      dialogo.showModal()
    }
    if (!estaInactivo && dialogo.open) {
      dialogo.close()
    }
  }, [estaInactivo])

  useEffect(() => () => window.clearTimeout(temporizador.current), [])

  // Las figuras ya no tienen animación CSS: se las lleva de la pose en que quedaron a su lugar de
  // siempre
  useLayoutEffect(() => {
    const dialogo = ref.current
    if (!estaSaliendo || !dialogo || !('animate' in dialogo)) {
      return
    }
    const suavizado = 'cubic-bezier(0.22, 1, 0.36, 1)'
    dialogo.querySelectorAll<HTMLElement>(FIGURAS).forEach((elemento, i) => {
      const poseInicial = congelado.current[i]
      if (!poseInicial) {
        return
      }
      const poseFinal = pose(elemento)
      // Lo que la pantalla normal oculta (píxeles en móvil) se desvanece en lugar de desaparecer de
      // golpe
      if (getComputedStyle(elemento).display === 'none') {
        elemento.style.display = 'grid'
        poseFinal.opacity = '0'
      }
      elemento.animate([poseInicial, poseFinal], {
        duration: REGRESO_MS,
        easing: suavizado,
        fill: 'forwards',
      })
    })
    dialogo.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: DESVANECER_MS,
      delay: RETRASO_DESVANECER_MS,
      easing: 'ease-in-out',
      fill: 'forwards',
    })
  }, [estaSaliendo])

  const salir = () => {
    const dialogo = ref.current
    if (estaSaliendo || !dialogo) {
      return
    }
    congelado.current = Array.from(dialogo.querySelectorAll(FIGURAS), pose)
    asignarEstaSaliendo(true)
    temporizador.current = window.setTimeout(() => {
      dialogo.close()
      dialogo.getAnimations?.().forEach((animacion) => animacion.cancel())
      asignarEstaSaliendo(false)
      despertar()
    }, SALIDA_MS)
  }

  return (
    <dialog
      ref={ref}
      className={estaSaliendo ? 'idle-screen idle-screen--leaving' : 'idle-screen'}
      aria-label="CuatroBits en pausa. Toca la pantalla o pulsa una tecla para continuar"
      onCancel={(evento) => {
        evento.preventDefault()
        salir()
      }}
      onKeyDown={(evento) => {
        evento.preventDefault()
        salir()
      }}
      onPointerDown={salir}
      onWheel={salir}
      onPointerMove={(evento) => {
        origenPuntero.current ??= { posicionX: evento.clientX, posicionY: evento.clientY }
        if (
          Math.hypot(
            evento.clientX - origenPuntero.current.posicionX,
            evento.clientY - origenPuntero.current.posicionY,
          ) > DISTANCIA_DESPERTAR
        ) {
          salir()
        }
      }}
    >
      {estaInactivo && (
        <>
          <Fondo esAnimado={!estaSaliendo} />
          <div className="idle-screen__logo">
            <MarcaLogo tamano={96} />
          </div>
        </>
      )}
    </dialog>
  )
}
