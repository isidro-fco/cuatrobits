/**
 * Archivo: index.tsx
 * Módulo: frontend / components / iconos
 * Descripción: Íconos SVG de la interfaz (flechas, reiniciar, pausa, ajustes, jugadores).
 * Requerimientos: RNF01, RNF03, RNF08
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import type { SVGProps } from 'react'

// ---------- Componentes ----------
function Icono(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="1.2em"
      height="1.2em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    />
  )
}

/**
 * Ícono de flecha hacia la derecha (avanzar).
 * @returns Imagen SVG decorativa
 * @see RNF03
 */
export const IconoFlechaDerecha = () => (
  <Icono>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icono>
)
/**
 * Ícono de flecha hacia la izquierda (regresar).
 * @returns Imagen SVG decorativa
 * @see RNF03
 */
export const IconoFlechaIzquierda = () => (
  <Icono>
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </Icono>
)
/**
 * Ícono de reiniciar la partida.
 * @returns Imagen SVG decorativa
 * @see RF21, RNF03
 */
export const IconoReiniciar = () => (
  <Icono>
    <path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5" />
  </Icono>
)
/**
 * Ícono de generar un nivel nuevo.
 * @returns Imagen SVG decorativa
 * @see RF36, RNF03
 */
export const IconoMezclar = () => (
  <Icono>
    <path d="M3 7h3c4.5 0 6.5 10 11 10h4M18 14l3 3-3 3" />
    <path d="M3 17h3c1.7 0 3-1.4 4.2-3.3M13.8 10.3C15 8.4 16.3 7 18 7h3M18 4l3 3-3 3" />
  </Icono>
)
/**
 * Ícono de volver al lobby.
 * @returns Imagen SVG decorativa
 * @see RF09, RNF03
 */
export const IconoInicio = () => (
  <Icono>
    <path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" />
  </Icono>
)
/**
 * Ícono de comenzar o continuar la partida.
 * @returns Imagen SVG decorativa
 * @see RNF03
 */
export const IconoJugar = () => (
  <Icono fill="currentColor" stroke="none">
    <path d="M7 4.5v15l13-7.5z" />
  </Icono>
)
/**
 * Ícono de pausar la partida.
 * @returns Imagen SVG decorativa
 * @see RIU09, RNF03
 */
export const IconoPausa = () => (
  <Icono fill="currentColor" stroke="none">
    <rect x="5" y="4" width="5" height="16" rx="1.5" />
    <rect x="14" y="4" width="5" height="16" rx="1.5" />
  </Icono>
)
/**
 * Ícono de ajustes.
 * @returns Imagen SVG decorativa
 * @see RF08, RNF03
 */
export const IconoEngrane = () => (
  <Icono>
    <circle cx="12" cy="12" r="3" />
    <path
      d={
        'M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 ' +
        '2.1' +
        'M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1'
      }
    />
  </Icono>
)
/**
 * Ícono del selector de jugadores.
 * @returns Imagen SVG decorativa
 * @see RF04, RNF03
 */
export const IconoUsuarios = () => (
  <Icono>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6" />
  </Icono>
)
/**
 * Ícono del perfil del jugador.
 * @returns Imagen SVG decorativa
 * @see RF07, RNF03
 */
export const IconoUsuario = () => (
  <Icono>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Icono>
)
/**
 * Ícono de confirmación.
 * @returns Imagen SVG decorativa
 * @see RNF03
 */
export const IconoPalomita = () => (
  <Icono strokeWidth={3.5}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Icono>
)
/**
 * Ícono de cerrar una ventana.
 * @returns Imagen SVG decorativa
 * @see RNF03
 */
export const IconoCerrar = () => (
  <Icono>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icono>
)
/**
 * Ícono de agregar un jugador.
 * @returns Imagen SVG decorativa
 * @see RF04, RNF03
 */
export const IconoMas = () => (
  <Icono>
    <path d="M12 5v14M5 12h14" />
  </Icono>
)
