import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export function NotFound() {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-7xl font-bold text-primary-200">404</p>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Sayfa bulunamadı</h1>
      <p className="max-w-md text-slate-500 dark:text-slate-400">
        Aradığınız sayfa taşınmış veya hiç var olmamış olabilir. Sahaya geri dönelim!
      </p>
      <Link to="/">
        <Button>Ana Sayfaya Dön</Button>
      </Link>
    </div>
  )
}
