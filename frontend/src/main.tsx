/**
 * Archivo: main.tsx
 * Módulo: frontend
 * Descripción: Punto de entrada del frontend: carga los estilos y monta la aplicación React.
 * Requerimientos: RDC01, RDC02, RDC04
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// ---------- Módulos internos ----------
import './index.css'
import './styles/components.css'
import './styles/pages.css'
import './styles/games.css'
import Aplicacion from './Aplicacion'

// ---------- Arranque ----------
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Aplicacion />
  </StrictMode>,
)
