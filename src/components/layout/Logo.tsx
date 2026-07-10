import { Link } from 'react-router-dom'
import { CircleDot } from 'lucide-react'

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="SahaSepeti ana sayfa">
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary-600 text-white">
        <CircleDot className="size-5" aria-hidden />
      </span>
      <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-ink-50">
        Saha<span className="text-primary-600">Sepeti</span>
      </span>
    </Link>
  )
}
