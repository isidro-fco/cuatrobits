/**
 * Archivo: Aplicacion.tsx
 * Módulo: frontend
 * Descripción: Componente raíz: crea el enrutador con las rutas de la aplicación.
 * Requerimientos: RF63, RDC01
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { createBrowserRouter, RouterProvider } from 'react-router'

// ---------- Módulos internos ----------
import { rutasAplicacion } from './rutas'

// ---------- Componente Aplicacion ----------
const enrutador = createBrowserRouter(rutasAplicacion)

/**
 * Componente raíz: crea el enrutador con todas las pantallas.
 * @returns Enrutador de la aplicación
 * @see RF63
 */
export default function Aplicacion() {
  return <RouterProvider router={enrutador} />
}
