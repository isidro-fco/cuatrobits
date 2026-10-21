import { Navigate, type RouteObject } from 'react-router'
import { RegisterRoute, RequirePlayer, Root } from './components/RouteGuards'
import { RecoverPage } from './pages/RecoverPage'
import { BallSortSetupPage } from './pages/BallSortSetupPage'
import { ConnectFourSetupPage } from './pages/ConnectFourSetupPage'
import { GamePage } from './pages/GamePage'
import { GameSetupPage } from './pages/GameSetupPage'
import { HistoryPage } from './pages/HistoryPage'
import { LobbyPage } from './pages/LobbyPage'
import { ProfilePage } from './pages/ProfilePage'
import { ResultsPage } from './pages/ResultsPage'
import { WorkshopPage } from './pages/WorkshopPage'

export const routes: RouteObject[] = [
  {
    element: <Root />,
    children: [
      { path: '/registro', element: <RegisterRoute /> },
      { path: '/recuperar', element: <RecoverPage /> },
      {
        element: <RequirePlayer />,
        children: [
          { path: '/', element: <LobbyPage /> },
          { path: '/perfil', element: <ProfilePage /> },
          { path: '/historial', element: <HistoryPage /> },
          { path: '/taller', element: <WorkshopPage /> },
          { path: '/preparar/connect-four', element: <ConnectFourSetupPage /> },
          { path: '/preparar/ball-sort', element: <BallSortSetupPage /> },
          { path: '/preparar/:game', element: <GameSetupPage /> },
          { path: '/juego/:gameId', element: <GamePage /> },
          { path: '/resultados', element: <ResultsPage /> },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]
