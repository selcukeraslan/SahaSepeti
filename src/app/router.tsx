import { createBrowserRouter } from 'react-router-dom'
import { PageShell } from '@/components/layout/PageShell'
import { RequireAuth, RequireRole } from '@/app/guards'
import { NotFound } from '@/pages/NotFound'

function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex min-h-[50dvh] items-center justify-center">
      <p className="text-lg font-medium text-slate-400">{title} — yakında</p>
    </div>
  )
}

export const router = createBrowserRouter([
  {
    element: <PageShell />,
    children: [
      { path: '/', element: <Placeholder title="Ana Sayfa" /> },
      { path: '/tesisler', element: <Placeholder title="Tesisler" /> },
      { path: '/tesis/:slug', element: <Placeholder title="Tesis Detay" /> },
      { path: '/giris', element: <Placeholder title="Giriş" /> },
      { path: '/kayit', element: <Placeholder title="Kayıt" /> },
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
