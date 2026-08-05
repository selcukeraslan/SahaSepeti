import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, CalendarCheck2, MapPin, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Container } from '@/components/layout/Container'
import { formatPrice } from '@/lib/format'
import type { VenueListItem } from '../types'
import { VenueSearchBox } from './VenueSearchBox'

interface LandingHeroProps {
  venues: readonly VenueListItem[]
}

function shuffleVenues(venues: readonly VenueListItem[]): VenueListItem[] {
  const shuffled = [...venues]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1))
    const currentVenue = shuffled[index]
    const targetVenue = shuffled[target]
    if (currentVenue && targetVenue) {
      shuffled[index] = targetVenue
      shuffled[target] = currentVenue
    }
  }
  return shuffled.slice(0, 6)
}

function HeroVenueSlide({ venue }: { venue?: VenueListItem }) {
  return (
    <div className="relative size-full shrink-0">
      {venue?.cover_image_url ? (
        <img src={venue.cover_image_url} alt="" className="size-full object-cover opacity-85" />
      ) : (
        <div className="absolute inset-5 rounded-[1.25rem] border-2 border-white/35">
          <span className="absolute left-1/2 top-0 h-full -translate-x-1/2 border-l-2 border-white/35" />
          <span className="absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/35" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/10 to-transparent" />
      <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-slate-900 shadow-lg backdrop-blur">
        <Sparkles className="size-3.5 text-accent-500" aria-hidden />
        Bugün oynamaya hazır
      </div>
      <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-300">
          Öne çıkan tesis
        </p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold sm:text-2xl">
              {venue?.name ?? 'Sıradaki maçın burada'}
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-white/70">
              <MapPin className="size-3.5" aria-hidden />
              {venue ? `${venue.district}, ${venue.city}` : 'Yakınındaki sahaları keşfet'}
            </p>
          </div>
          {venue?.minPrice !== null && venue?.minPrice !== undefined && (
            <div className="shrink-0 text-right">
              <p className="text-lg font-semibold">{formatPrice(venue.minPrice)}</p>
              <p className="text-xs text-white/60">saatlik başlangıç</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function LandingHero({ venues }: LandingHeroProps) {
  const shuffledVenues = useMemo(() => shuffleVenues(venues), [venues])
  const [activeIndex, setActiveIndex] = useState(0)
  const [transitionEnabled, setTransitionEnabled] = useState(true)
  const firstVenue = shuffledVenues[0]
  const carouselVenues =
    shuffledVenues.length > 1 && firstVenue ? [...shuffledVenues, firstVenue] : shuffledVenues

  useEffect(() => {
    if (shuffledVenues.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current >= shuffledVenues.length ? 1 : current + 1))
    }, 5000)

    return () => window.clearInterval(interval)
  }, [shuffledVenues.length])

  return (
    <section className="relative overflow-hidden bg-[#f4f5ef] pb-12 pt-12 dark:bg-ink-950 sm:pb-16 sm:pt-16 lg:pb-20 lg:pt-20">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[38rem] opacity-45 dark:opacity-20"
        style={{
          background:
            'radial-gradient(circle at 12% 18%, rgb(16 185 129 / 0.18), transparent 27%), radial-gradient(circle at 88% 5%, rgb(245 158 11 / 0.12), transparent 25%)',
        }}
      />
      <Container className="relative">
        <div className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-900/10 bg-white/70 px-3 py-1.5 text-xs font-semibold text-primary-800 shadow-sm backdrop-blur dark:border-primary-400/15 dark:bg-ink-900/70 dark:text-primary-300">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary-400 opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-primary-500" />
              </span>
              Şehrindeki müsait sahalar tek ekranda
            </div>

            <h1 className="mt-6 max-w-3xl text-[2.8rem] font-semibold leading-[0.98] tracking-[-0.055em] text-slate-950 dark:text-white sm:text-6xl lg:text-[4.65rem]">
              Sahaya çıkmanın
              <span className="mt-2 block text-primary-700 dark:text-primary-400">kolay yolu.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 dark:text-ink-300 sm:text-lg sm:leading-8">
              Yakınındaki spor tesislerini karşılaştır, sana uyan saati bul ve rezervasyonunu
              birkaç adımda oluştur.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link
                to="/tesisler"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-slate-950 px-6 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-primary-700 dark:bg-primary-500 dark:text-ink-950 dark:hover:bg-primary-400"
              >
                Tesisleri keşfet
                <ArrowUpRight className="size-4" aria-hidden />
              </Link>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-ink-400">
                <CalendarCheck2 className="size-4 text-primary-600" aria-hidden />
                Tarih ve saate göre ara
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div className="absolute -left-5 top-12 hidden h-28 w-28 rounded-full border border-primary-700/15 lg:block" />
            <div className="relative rotate-[1.5deg] overflow-hidden rounded-[2rem] bg-primary-950 p-2 shadow-[0_32px_80px_-36px_rgba(2,44,34,0.65)] transition-transform duration-500 hover:rotate-0 dark:ring-1 dark:ring-white/10">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1.55rem] bg-primary-900">
                {carouselVenues.length > 0 ? (
                  <div
                    className={`flex size-full ${transitionEnabled ? 'transition-transform duration-700 ease-in-out' : ''}`}
                    style={{ transform: `translateX(-${activeIndex * 100}%)` }}
                    onTransitionEnd={() => {
                      if (activeIndex !== shuffledVenues.length) return
                      setTransitionEnabled(false)
                      setActiveIndex(0)
                      window.requestAnimationFrame(() => {
                        window.requestAnimationFrame(() => setTransitionEnabled(true))
                      })
                    }}
                  >
                    {carouselVenues.map((venue, index) => (
                      <HeroVenueSlide key={`${venue.id}-${index}`} venue={venue} />
                    ))}
                  </div>
                ) : (
                  <HeroVenueSlide />
                )}
              </div>
            </div>
            <div className="absolute -bottom-4 -right-3 -rotate-2 rounded-2xl border border-white/80 bg-white px-4 py-3 shadow-xl dark:border-ink-700 dark:bg-ink-900 sm:right-5">
              <p className="text-xs text-slate-400 dark:text-ink-400">Üç adımda sahada</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">
                Bul · Öde · Oyna
              </p>
            </div>
          </div>
        </div>

        <div className="mt-14 lg:mt-16">
          <VenueSearchBox />
        </div>
      </Container>
    </section>
  )
}
