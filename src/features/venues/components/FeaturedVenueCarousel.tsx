import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { VenueListItem } from '../types'
import { VenueCard } from './VenueCard'

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
  return shuffled
}

export function FeaturedVenueCarousel({ venues }: { venues: readonly VenueListItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)
  const shuffledVenues = useMemo(() => shuffleVenues(venues), [venues])

  const move = useCallback((direction: -1 | 1) => {
    const track = trackRef.current
    if (!track) return
    const firstCard = track.firstElementChild
    if (!(firstCard instanceof HTMLElement)) return

    const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 0
    const step = firstCard.offsetWidth + gap
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - step / 2
    const atStart = track.scrollLeft <= step / 2

    if (direction === 1 && atEnd) {
      track.scrollTo({ left: 0, behavior: 'smooth' })
    } else if (direction === -1 && atStart) {
      track.scrollTo({ left: track.scrollWidth, behavior: 'smooth' })
    } else {
      track.scrollBy({ left: direction * step, behavior: 'smooth' })
    }
  }, [])

  useEffect(() => {
    if (
      isPaused ||
      shuffledVenues.length < 2 ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    const interval = window.setInterval(() => move(1), 4500)
    return () => window.clearInterval(interval)
  }, [isPaused, move, shuffledVenues.length])

  return (
    <div
      className="relative"
      role="region"
      aria-label="Öne çıkan tesisler"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {shuffledVenues.map((venue) => (
          <div
            key={venue.id}
            className="w-[88%] shrink-0 snap-start sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.834rem)]"
          >
            <VenueCard venue={venue} />
          </div>
        ))}
      </div>

      {shuffledVenues.length > 1 && (
        <div className="mt-4 hidden items-center justify-end gap-2 sm:flex">
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label="Önceki tesis"
            className="flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:border-primary-300 hover:text-primary-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            aria-label="Sonraki tesis"
            className="flex size-10 items-center justify-center rounded-full bg-primary-700 text-white transition-colors hover:bg-primary-800 dark:bg-primary-500 dark:text-ink-950"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      )}
    </div>
  )
}
