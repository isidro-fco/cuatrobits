/**
 * Archivo: rutas.tsx
 * Módulo: frontend
 * Descripción: Rutas de React Router de todas las pantallas.
 * Requerimientos: RF63, RF09, RDC09
 * Autores: Isidro Francisco Pérez Paz y Angel Rey Rodriguez
 * Fecha: 2026-10-21
 * Última modificación: 2026-11-09, Isidro F. Pérez Paz
 */

// ---------- Librerías externas ----------
import { Navigate, type RouteObject } from 'react-router'

// ---------- Módulos internos ----------
import { RutaRegistro, RequiereJugador, Raiz } from './components/GuardiasRutas'
import { PaginaRecuperar } from './pages/PaginaRecuperar'
import { PaginaPrepararEsferas } from './pages/PaginaPrepararEsferas'
import { PaginaPrepararConecta4 } from './pages/PaginaPrepararConecta4'
import { PaginaJuego } from './pages/PaginaJuego'
import { PaginaPrepararJuego } from './pages/PaginaPrepararJuego'
import { PaginaHistorial } from './pages/PaginaHistorial'
import { PaginaLobby } from './pages/PaginaLobby'
import { PaginaPerfil } from './pages/PaginaPerfil'
import { PaginaResultados } from './pages/PaginaResultados'
import { PaginaTaller } from './pages/PaginaTaller'

// ---------- Rutas de la aplicación ----------
/** Rutas de todas las pantallas (RF63) */
export const rutasAplicacion: RouteObject[] = [
  {
    element: <Raiz />,
    children: [
      { path: '/registro', element: <RutaRegistro /> },
      { path: '/recuperar', element: <PaginaRecuperar /> },
      {
        element: <RequiereJugador />,
        children: [
          { path: '/', element: <PaginaLobby /> },
          { path: '/perfil', element: <PaginaPerfil /> },
          { path: '/historial', element: <PaginaHistorial /> },
          { path: '/taller', element: <PaginaTaller /> },
          { path: '/preparar/connect-four', element: <PaginaPrepararConecta4 /> },
          { path: '/preparar/ball-sort', element: <PaginaPrepararEsferas /> },
          { path: '/preparar/:juego', element: <PaginaPrepararJuego /> },
          { path: '/juego/:idJuego', element: <PaginaJuego /> },
          { path: '/resultados', element: <PaginaResultados /> },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]
