import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { useIdle } from '../hooks/useIdle'
import { Background } from './Background'
import { LogoMark } from './Logo'

/** Tiempo sin actividad antes de mostrar el protector de pantalla */
export const IDLE_MS = 30_000

const RETURN_MS = 3500
const FADE_DELAY_MS = 3000
/** Fundido con el que reaparece la pantalla (las islas del lobby) */
const FADE_MS = 800

/** Duración de la salida: las figuras vuelven a su lugar y después aparece la pantalla */
export const LEAVE_MS = FADE_DELAY_MS + FADE_MS

/** Distancia que debe moverse el puntero para despertar; evita que un movimiento sintético lo cierre al abrirse */
const WAKE_DISTANCE = 12

const FIGURES = '.blob, .pixels, .pixels i'

type Pose = { transform: string; scale: string; borderRadius: string; opacity: string }

function pose(el: Element): Pose {
  const s = getComputedStyle(el)
  return { transform: s.transform, scale: s.scale, borderRadius: s.borderRadius, opacity: s.opacity }
}

/**
 * Protector de pantalla: tras 30 s sin actividad oculta la pantalla actual y muestra el fondo en
 * movimiento con el logotipo al centro. Al despertar, las figuras regresan suavemente a su lugar y la
 * pantalla reaparece con un fundido. No aparece durante las partidas.
 */
export function IdleScreen() {
  const { pathname } = useLocation()
  const { idle, wake } = useIdle(IDLE_MS, !pathname.startsWith('/juego/'))
  const [leaving, setLeaving] = useState(false)
  const ref = useRef<HTMLDialogElement>(null)
  const origin = useRef<{ x: number; y: number } | null>(null)
  const frozen = useRef<Pose[]>([])
  const timer = useRef<number>(undefined)

  // <dialog> modal: queda por encima de cualquier ventana abierta y bloquea la pantalla de abajo
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (idle && !dialog.open) {
      origin.current = null
      dialog.showModal()
    }
    if (!idle && dialog.open) dialog.close()
  }, [idle])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  // Las figuras ya no tienen animación CSS: se las lleva de la pose en que quedaron a su lugar de siempre
  useLayoutEffect(() => {
    const dialog = ref.current
    if (!leaving || !dialog || !('animate' in dialog)) return
    const easing = 'cubic-bezier(0.22, 1, 0.36, 1)'
    dialog.querySelectorAll<HTMLElement>(FIGURES).forEach((el, i) => {
      const from = frozen.current[i]
      if (!from) return
      const to = pose(el)
      // Lo que la pantalla normal oculta (píxeles en móvil) se desvanece en lugar de desaparecer de golpe
      if (getComputedStyle(el).display === 'none') {
        el.style.display = 'grid'
        to.opacity = '0'
      }
      el.animate([from, to], { duration: RETURN_MS, easing, fill: 'forwards' })
    })
    dialog.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: FADE_MS,
      delay: FADE_DELAY_MS,
      easing: 'ease-in-out',
      fill: 'forwards',
    })
  }, [leaving])

  const leave = () => {
    const dialog = ref.current
    if (leaving || !dialog) return
    frozen.current = Array.from(dialog.querySelectorAll(FIGURES), pose)
    setLeaving(true)
    timer.current = window.setTimeout(() => {
      dialog.close()
      dialog.getAnimations?.().forEach((a) => a.cancel())
      setLeaving(false)
      wake()
    }, LEAVE_MS)
  }

  return (
    <dialog
      ref={ref}
      className={leaving ? 'idle-screen idle-screen--leaving' : 'idle-screen'}
      aria-label="CuatroBits en pausa. Toca la pantalla o pulsa una tecla para continuar"
      onCancel={(e) => {
        e.preventDefault()
        leave()
      }}
      onKeyDown={(e) => {
        e.preventDefault()
        leave()
      }}
      onPointerDown={leave}
      onWheel={leave}
      onPointerMove={(e) => {
        origin.current ??= { x: e.clientX, y: e.clientY }
        if (Math.hypot(e.clientX - origin.current.x, e.clientY - origin.current.y) > WAKE_DISTANCE) leave()
      }}
    >
      {idle && (
        <>
          <Background animated={!leaving} />
          <div className="idle-screen__logo">
            <LogoMark size={96} />
          </div>
        </>
      )}
    </dialog>
  )
}
