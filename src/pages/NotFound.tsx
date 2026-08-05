import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BrandMark } from '@/components/layout/BrandMark'
import { Button } from '@/components/ui/Button'

export function NotFound() {
  return (
    <section className="relative flex min-h-[68dvh] items-center overflow-hidden bg-[#f4f5ef] py-16 dark:bg-ink-950">
      <div aria-hidden className="absolute left-1/2 top-1/2 size-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border-[5rem] border-primary-600/[0.05]" />
      <div className="relative mx-auto max-w-xl px-4 text-center">
        <BrandMark className="mx-auto size-12" />
        <p className="mt-6 font-mono text-sm font-semibold tracking-[0.25em] text-primary-600">404</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white sm:text-5xl">Bu saha çizgilerin dışında.</h1>
        <p className="mx-auto mt-5 max-w-md leading-7 text-slate-600 dark:text-ink-300">Aradığınız sayfa taşınmış veya artık mevcut olmayabilir. Oyuna ana sayfadan devam edebilirsiniz.</p>
        <Link to="/" className="mt-7 inline-block">
          <Button size="lg" className="rounded-full"><ArrowLeft className="size-4" aria-hidden />Ana sayfaya dön</Button>
        </Link>
      </div>
    </section>
  )
}
