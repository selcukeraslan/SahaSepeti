import type { ReactNode } from 'react'
import { Container } from './Container'

interface PublicPageHeroProps {
  eyebrow?: string
  title: string
  description?: string
  aside?: ReactNode
}

export function PublicPageHero({ eyebrow, title, description, aside }: PublicPageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200/70 bg-[#f4f5ef] py-10 dark:border-ink-800 dark:bg-ink-950 sm:py-14">
      <div
        aria-hidden
        className="absolute inset-0 opacity-60 dark:opacity-20"
        style={{
          background:
            'radial-gradient(circle at 8% 15%, rgb(16 185 129 / 0.16), transparent 24%), radial-gradient(circle at 92% 5%, rgb(245 158 11 / 0.1), transparent 22%)',
        }}
      />
      <Container className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div className="max-w-3xl">
          {eyebrow && (
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">
              {eyebrow}
            </p>
          )}
          <h1 className={eyebrow ? 'mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white sm:text-5xl' : 'text-4xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white sm:text-5xl'}>
            {title}
          </h1>
          {description && (
            <p className="mt-4 max-w-2xl leading-7 text-slate-600 dark:text-ink-300">
              {description}
            </p>
          )}
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </Container>
    </section>
  )
}
