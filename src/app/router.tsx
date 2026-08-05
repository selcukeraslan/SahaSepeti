import { createBrowserRouter } from 'react-router-dom'
import { PageShell } from '@/components/layout/PageShell'
import { RequireAuth, RequireRole } from '@/app/guards'

export const router = createBrowserRouter([
  {
    element: <PageShell />,
    children: [
      { path: '/', lazy: async () => ({ Component: (await import('@/pages/Landing')).Landing }) },
      {
        path: '/tesisler',
        lazy: async () => ({ Component: (await import('@/pages/VenueList')).VenueList }),
      },
      {
        path: '/tesis/:slug',
        lazy: async () => ({ Component: (await import('@/pages/VenueDetail')).VenueDetail }),
      },
      {
        path: '/hakkimizda',
        lazy: async () => ({ Component: (await import('@/pages/About')).About }),
      },
      {
        path: '/iletisim',
        lazy: async () => ({ Component: (await import('@/pages/Contact')).Contact }),
      },
      { path: '/giris', lazy: async () => ({ Component: (await import('@/pages/Login')).Login }) },
      {
        path: '/kayit',
        lazy: async () => ({ Component: (await import('@/pages/Register')).Register }),
      },
      {
        element: <RequireAuth />,
        children: [
          {
            path: '/rezervasyonlarim',
            lazy: async () => ({
              Component: (await import('@/pages/MyReservations')).MyReservations,
            }),
          },
          {
            path: '/favorilerim',
            lazy: async () => ({ Component: (await import('@/pages/Favorites')).Favorites }),
          },
        ],
      },
      {
        element: <RequireRole role="venue_owner" />,
        children: [
          {
            path: '/panel',
            lazy: async () => ({
              Component: (await import('@/pages/dashboard/DashboardLayout')).DashboardLayout,
            }),
            children: [
              {
                index: true,
                lazy: async () => ({
                  Component: (await import('@/pages/dashboard/DashboardHome')).DashboardHome,
                }),
              },
              {
                path: 'takvim',
                lazy: async () => ({
                  Component: (await import('@/pages/dashboard/DashboardCalendar')).DashboardCalendar,
                }),
              },
              {
                path: 'tesisler',
                lazy: async () => ({
                  Component: (await import('@/pages/dashboard/DashboardVenues')).DashboardVenues,
                }),
              },
              {
                path: 'tesisler/yeni',
                lazy: async () => ({
                  Component: (await import('@/pages/dashboard/VenueCreate')).VenueCreate,
                }),
              },
              {
                path: 'tesisler/:id',
                lazy: async () => ({
                  Component: (await import('@/pages/dashboard/VenueManage')).VenueManage,
                }),
              },
              {
                path: 'rezervasyonlar',
                lazy: async () => ({
                  Component: (await import('@/pages/dashboard/DashboardReservations'))
                    .DashboardReservations,
                }),
              },
              {
                path: 'istatistik',
                lazy: async () => ({
                  Component: (await import('@/pages/dashboard/DashboardStats')).DashboardStats,
                }),
              },
            ],
          },
        ],
      },
      {
        element: <RequireRole role="admin" />,
        children: [
          {
            path: '/admin',
            lazy: async () => ({
              Component: (await import('@/pages/admin/AdminLayout')).AdminLayout,
            }),
            children: [
              {
                index: true,
                lazy: async () => ({
                  Component: (await import('@/pages/admin/AdminVenueQueue')).AdminVenueQueue,
                }),
              },
              {
                path: 'tesisler',
                lazy: async () => ({
                  Component: (await import('@/pages/admin/AdminVenues')).AdminVenues,
                }),
              },
              {
                path: 'rezervasyonlar',
                lazy: async () => ({
                  Component: (await import('@/pages/admin/AdminReservations')).AdminReservations,
                }),
              },
            ],
          },
        ],
      },
      {
        path: '*',
        lazy: async () => ({ Component: (await import('@/pages/NotFound')).NotFound }),
      },
    ],
  },
])
