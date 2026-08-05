import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { BrandMark } from '@/components/layout/BrandMark'

interface AuthShellProps {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}

const BENEFITS = ['Tesisleri karşılaştır', 'Müsait saatleri gör', 'Rezervasyonlarını yönet']

export function AuthShell({ eyebrow, title, description, children, footer }: AuthShellProps) {
  return (
    <section className="relative overflow-hidden bg-[#f4f5ef] py-10 dark:bg-ink-950 sm:py-16">
      <Container>
        <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_32px_90px_-48px_rgba(15,23,42,0.45)] dark:border-ink-700 dark:bg-ink-900 lg:grid-cols-[0.86fr_1.14fr]">
          <div className="relative overflow-hidden bg-primary-950 px-7 py-10 text-white sm:px-10 lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-14">
            <div aria-hidden className="absolute -right-24 -top-24 size-64 rounded-full border-[40px] border-white/5" />
            <div className="relative">
              <BrandMark className="size-12 ring-1 ring-white/10" />
              <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-primary-300">
                Sahaya çıkmanın kolay yolu
              </p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.04em]">
                Oyuna bir adım daha yakınsın.
              </h2>
            </div>
            <ul className="relative mt-10 space-y-3 text-sm text-primary-100 lg:mt-16">
              {BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-center gap-2.5">
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary-400/15">
                    <Check className="size-3 text-primary-300" aria-hidden />
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
          <div className="px-6 py-9 sm:px-10 sm:py-12 lg:px-14">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-400">
              {eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-ink-400">{description}</p>
            <div className="mt-7">{children}</div>
            <div className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-500 dark:border-ink-800 dark:text-ink-400">
              {footer}
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
