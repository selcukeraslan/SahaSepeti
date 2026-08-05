import { Link } from 'react-router-dom'
import { BrandMark } from './BrandMark'

export function Logo() {
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label="SahaSepeti ana sayfa">
      <BrandMark className="size-9 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105" />
      <span className="text-[1.08rem] font-extrabold lowercase tracking-[-0.055em] text-slate-950 dark:text-white">
        saha<span className="mx-0.5 font-medium text-accent-500">/</span>sepeti
      </span>
    </Link>
  )
}
