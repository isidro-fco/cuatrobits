/**
 * Archivo: MenuPausa.tsx
 * Módulo: frontend / components
 * Descripción: Menú de pausa: continuar, reiniciar, ajustes y salir al lobby.
 * Requerimientos: RIU09, RF09, RF21
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { useNavigate } from 'react-router'

// ---------- Módulos internos ----------
import { IconoInicio, IconoPausa, IconoJugar, IconoReiniciar } from './iconos'
import { SpritePixel } from './SpritePixel'
import { useSpriteBitBot } from '../hooks/useSpriteBitBot'
import { PanelAjustes } from './PanelAjustes'

// ---------- Tipos ----------
interface PropsMenuPausa {
  alReanudar: () => void
  alReiniciar: () => void
}

// ---------- Componente MenuPausa ----------
/**
 * Menú de pausa: continuar, reiniciar, ajustes y salir al lobby.
 * @param props Propiedades del componente
 * @param props.alReanudar Función que cierra el menú y continúa la partida
 * @param props.alReiniciar Función que empieza una partida nueva
 * @returns Ventana modal del menú
 * @see RIU09, RF09, RF21
 */
export function MenuPausa({ alReanudar, alReiniciar }: PropsMenuPausa) {
  const navegar = useNavigate()
  const bitbot = useSpriteBitBot()
  return (
    <div className="pause">
      <header className="pause__head">
        <span className="pause__icon" aria-hidden>
          <IconoPausa />
        </span>
        <div>
          <h2 id="pause-title">¡Juego en pausa!</h2>
          <p>Tómate un descanso o ajusta tus preferencias.</p>
        </div>
      </header>
      <div className="pause__body">
        <div className="pause__actions">
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={alReanudar}
            autoFocus
          >
            <IconoJugar />
            Continuar jugando
          </button>
          <button type="button" className="btn btn--soft btn--block" onClick={alReiniciar}>
            <IconoReiniciar />
            Reiniciar partida
          </button>
          <button
            type="button"
            className="btn btn--outline btn--block"
            onClick={() => navegar('/')}
          >
            <IconoInicio />
            Salir al lobby
          </button>
          <div className="pause__mascot">
            <span>
              <SpritePixel sprite={bitbot} tamano={64} />
            </span>
            ¡Te espero!
          </div>
        </div>
        <PanelAjustes />
      </div>
    </div>
  )
}
