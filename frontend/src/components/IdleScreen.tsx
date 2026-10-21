import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import { useIdle } from '../hooks/useIdle'
import { Background } from './Background'
import { LogoMark } from './Logo'

/** Tiempo sin actividad antes de mostrar el protector de pantalla */
export const IDLE_MS = 30_000

/** Distancia que debe moverse el puntero para despertar; evita que un movimiento sintético lo cierre al abrirse */
const WAKE_DISTANCE = 12

/**
 * Protector de pantalla: tras 30 s sin actividad oculta la pantalla actual y muestra el fondo en
 * movimiento con el logotipo al centro. No aparece durante las partidas.
 */
export function IdleScreen() {
  const { pathname } = useLocation()
  const { idle, wake } = useIdle(IDLE_MS, !pathname.startsWith('/juego/'))
  const ref = useRef<HTMLDialogElement>(null)
  const origin = useRef<{ x: number; y: number } | null>(null)

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

  return (
    <dialog
      ref={ref}
      className="idle-screen"
      aria-label="CuatroBits en pausa. Toca la pantalla o pulsa una tecla para continuar"
      onCancel={(e) => {
        e.preventDefault()
        wake()
      }}
      onKeyDown={(e) => {
        e.preventDefault()
        wake()
      }}
      onPointerDown={wake}
      onWheel={wake}
      onPointerMove={(e) => {
        origin.current ??= { x: e.clientX, y: e.clientY }
        if (Math.hypot(e.clientX - origin.current.x, e.clientY - origin.current.y) > WAKE_DISTANCE) wake()
      }}
    >
      {idle && (
        <>
          <Background animated />
          <div className="idle-screen__logo">
            <LogoMark size={96} />
          </div>
        </>
      )}
    </dialog>
  )
}
