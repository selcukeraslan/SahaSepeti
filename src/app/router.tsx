import { createBrowserRouter } from 'react-router-dom'
import { PageShell } from '@/components/layout/PageShell'
import { RequireAuth, RequireRole } from '@/app/guards'
import { Landing } from '@/pages/Landing'
import { VenueList } from '@/pages/VenueList'
import { VenueDetail } from '@/pages/VenueDetail'
import { MyReservations } from '@/pages/MyReservations'
import { Favorites } from '@/pages/Favorites'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { About } from '@/pages/About'
import { Contact } from '@/pages/Contact'
import { DashboardLayout } from '@/pages/dashboard/DashboardLayout'
import { DashboardHome } from '@/pages/dashboard/DashboardHome'
import { DashboardVenues } from '@/pages/dashboard/DashboardVenues'
import { VenueCreate } from '@/pages/dashboard/VenueCreate'
import { VenueManage } from '@/pages/dashboard/VenueManage'
import { DashboardReservations } from '@/pages/dashboard/DashboardReservations'
import { AdminLayout } from '@/pages/admin/AdminLayout'
import { AdminVenueQueue } from '@/pages/admin/AdminVenueQueue'
import { AdminVenues } from '@/pages/admin/AdminVenues'
import { AdminReservations } from '@/pages/admin/AdminReservations'
import { NotFound } from '@/pages/NotFound'

export const router = createBrowserRouter([
  {
    element: <PageShell />,
    children: [
      { path: '/', element: <Landing /> },
      { path: '/tesisler', element: <VenueList /> },
      { path: '/tesis/:slug', element: <VenueDetail /> },
      { path: '/hakkimizda', element: <About /> },
      { path: '/iletisim', element: <Contact /> },
      { path: '/giris', element: <Login /> },
      { path: '/kayit', element: <Register /> },
      {
        element: <RequireAuth />,
        children: [
          { path: '/rezervasyonlarim', element: <MyReservations /> },
          { path: '/favorilerim', element: <Favorites /> },
        ],
      },
      {
        element: <RequireRole role="venue_owner" />,
        children: [
          {
            path: '/panel',
            element: <DashboardLayout />,
            children: [
              { index: true, element: <DashboardHome /> },
              { path: 'tesisler', element: <DashboardVenues /> },
              { path: 'tesisler/yeni', element: <VenueCreate /> },
              { path: 'tesisler/:id', element: <VenueManage /> },
              { path: 'rezervasyonlar', element: <DashboardReservations /> },
            ],
          },
        ],
      },
      {
        element: <RequireRole role="admin" />,
        children: [
          {
            path: '/admin',
            element: <AdminLayout />,
            children: [
              { index: true, element: <AdminVenueQueue /> },
              { path: 'tesisler', element: <AdminVenues /> },
              { path: 'rezervasyonlar', element: <AdminReservations /> },
            ],
          },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
])
