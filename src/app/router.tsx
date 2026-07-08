import { createBrowserRouter } from 'react-router-dom'
import { PageShell } from '@/components/layout/PageShell'
import { RequireAuth, RequireRole } from '@/app/guards'
import { Landing } from '@/pages/Landing'
import { VenueList } from '@/pages/VenueList'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { Placeholder } from '@/pages/Placeholder'
import { NotFound } from '@/pages/NotFound'

export const router = createBrowserRouter([
  {
    element: <PageShell />,
    children: [
      { path: '/', element: <Landing /> },
      { path: '/tesisler', element: <VenueList /> },
      { path: '/tesis/:slug', element: <Placeholder title="Tesis Detay" /> },
      { path: '/giris', element: <Login /> },
      { path: '/kayit', element: <Register /> },
      {
        element: <RequireAuth />,
        children: [
          { path: '/rezervasyonlarim', element: <Placeholder title="Rezervasyonlarım" /> },
        ],
      },
      {
        element: <RequireRole role="venue_owner" />,
        children: [{ path: '/panel/*', element: <Placeholder title="Tesis Paneli" /> }],
      },
      {
        element: <RequireRole role="admin" />,
        children: [{ path: '/admin/*', element: <Placeholder title="Admin" /> }],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
])
