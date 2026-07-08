import { createBrowserRouter } from 'react-router-dom'

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary-600">SahaSepeti</h1>
          <p className="mt-2 text-slate-500">Kurulum tamamlandı — sayfalar yakında.</p>
        </div>
      </div>
    ),
  },
])
