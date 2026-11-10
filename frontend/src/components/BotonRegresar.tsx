/**
 * Archivo: BotonRegresar.tsx
 * Módulo: frontend / components
 * Descripción: Botón para volver a la pantalla anterior o al lobby.
 * Requerimientos: RF09, RNF01
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { Link } from 'react-router'

// ---------- Módulos internos ----------
import { IconoFlechaIzquierda } from './iconos'

// ---------- Componente BotonRegresar ----------
/**
 * Botón para volver a otra pantalla, por defecto al lobby.
 * @param props Propiedades del componente
 * @param props.destino Ruta a la que regresa
 * @param props.etiqueta Texto visible o accesible
 * @returns Enlace con forma de botón
 * @see RF09
 */
export function BotonRegresar({
  destino = '/',
  etiqueta = 'Volver al lobby',
}: {
  destino?: string
  etiqueta?: string
}) {
  return (
    <Link to={destino} className="btn btn--outline btn--small">
      <IconoFlechaIzquierda />
      {etiqueta}
    </Link>
  )
}
