/**
 * Archivo: SelectorJugador.tsx
 * Módulo: frontend / components
 * Descripción: Selector para cambiar el perfil activo en dispositivos compartidos.
 * Requerimientos: RF04, RIU02
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { useNavigate } from 'react-router'

// ---------- Módulos internos ----------
import { useJugadorStore } from '../stores/useJugadorStore'
import { calcularNivel } from '../utils/progresion'
import { Avatar } from './Avatar'
import { IconoPalomita, IconoMas } from './iconos'

// ---------- Componente SelectorJugador ----------
// Selector de jugador para dispositivos compartidos (sección 3.1)
/**
 * Lista de perfiles del dispositivo para cambiar el jugador activo.
 * @param props Propiedades del componente
 * @param props.alTerminar Función que cierra el selector
 * @returns Lista de perfiles y botón para crear otro
 * @see RF04, RIU02
 */
export function SelectorJugador({ alTerminar }: { alTerminar: () => void }) {
  const { perfiles, idActivo, cambiarA } = useJugadorStore()
  const navegar = useNavigate()

  return (
    <div className="switcher">
      <h2 id="switcher-title">¿Quién va a jugar?</h2>
      <ul className="switcher__list">
        {perfiles.map((jugador) => (
          <li key={jugador.id}>
            <button
              type="button"
              className="choice switcher__item"
              aria-pressed={jugador.id === idActivo}
              onClick={() => {
                cambiarA(jugador.id)
                alTerminar()
              }}
            >
              <Avatar id={jugador.avatar} apariencia={jugador.bitbot} tamano={52} />
              <span>
                {jugador.username}
                <span className="choice__sub">Nivel {calcularNivel(jugador.xp).nivel}</span>
              </span>
              {jugador.id === idActivo && (
                <span className="choice__check">
                  <IconoPalomita />
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="btn btn--soft btn--block"
        onClick={() => {
          alTerminar()
          navegar('/registro?nuevo=1')
        }}
      >
        <IconoMas />
        Crear otro jugador
      </button>
    </div>
  )
}
