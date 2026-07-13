import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { List, LocateFixed, Map as MapIcon, SlidersHorizontal } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/useToast'
import { VenueCard } from '@/features/venues/components/VenueCard'
import { VenueFilterFields } from '@/features/venues/components/VenueFilterFields'
import { VenueMap } from '@/features/venues/components/VenueMap'
import { useVenues } from '@/features/venues/hooks/useVenues'
import type { VenueFilters, VenueListItem } from '@/features/venues/types'
import { distanceToOrNull, type GeoPoint } from '@/lib/geo'
import { cn } from '@/lib/utils'

function paramsToFilters(params: URLSearchParams): VenueFilters {
  return {
    city: params.get('city') ?? undefined,
    district: params.get('district') ?? undefined,
    sport: params.get('sport') ?? undefined,
    date: params.get('date') ?? undefined,
    q: params.get('q') ?? undefined,
  }
}

interface VenueWithDistance {
  venue: VenueListItem
  distanceKm: number | null
}

/** Konum varsa mesafeye göre sıralar (koordinatı olmayanlar sona). */
function withDistances(venues: VenueListItem[], from: GeoPoint | null): VenueWithDistance[] {
  const items = venues.map((venue) => ({
    venue,
    distanceKm: from ? distanceToOrNull(venue, from) : null,
  }))
  if (!from) return items
  return items.sort((a, b) => {
    if (a.distanceKm === null) return 1
    if (b.distanceKm === null) return -1
    return a.distanceKm - b.distanceKm
  })
}

export function VenueList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [view, setView] = useState<'list' | 'map'>('list')
  const [userLoc, setUserLoc] = useState<GeoPoint | null>(null)
  const [locating, setLocating] = useState(false)
  const { toast } = useToast()

  const filters = useMemo(() => paramsToFilters(searchParams), [searchParams])
  const { data: venues, isLoading, isError } = useVenues(filters)

  const items = useMemo(() => withDistances(venues ?? [], userLoc), [venues, userLoc])

  const applyFilters = (next: VenueFilters) => {
    const params = new URLSearchParams()
    if (next.sport) params.set('sport', next.sport)
    if (next.city) params.set('city', next.city)
    if (next.district) params.set('district', next.district)
    if (next.date) params.set('date', next.date)
    if (next.q) params.set('q', next.q)
    setSearchParams(params, { replace: true })
  }

  const clearFilters = () => setSearchParams(new URLSearchParams(), { replace: true })

  const activeFilterCount = [filters.sport, filters.city, filters.district, filters.q].filter(
    Boolean,
  ).length

  /** "Yakınımdakiler": konum izni iste; açıksa kapat. */
  const toggleNearMe = () => {
    if (userLoc) {
      setUserLoc(null)
      return
    }
    if (!('geolocation' in navigator)) {
      toast('Tarayıcınız konum özelliğini desteklemiyor', 'error')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false)
        setUserLoc({ lat: position.coords.latitude, lng: position.coords.longitude })
        toast('Tesisler konumunuza göre sıralandı', 'success')
      },
      (error) => {
        setLocating(false)
        toast(
          error.code === error.PERMISSION_DENIED
            ? 'Konum izni verilmedi. Tarayıcı ayarlarından izin verebilirsiniz.'
            : 'Konumunuz alınamadı. Lütfen tekrar deneyin.',
          'error',
        )
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    )
  }

  return (
    <Container className="py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-ink-50 sm:text-3xl">Spor Tesisleri</h1>
          <p className="mt-1 text-slate-500 dark:text-ink-400">
            {venues ? `${venues.length} tesis bulundu` : 'Tesisler yükleniyor...'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Yakınımdakiler */}
          <Button
            variant={userLoc ? 'secondary' : 'outline'}
            size="sm"
            isLoading={locating}
            onClick={toggleNearMe}
            aria-pressed={userLoc !== null}
          >
            <LocateFixed className="size-4" aria-hidden />
            {userLoc ? 'Yakınımdakiler ✓' : 'Yakınımdakiler'}
          </Button>

          {/* Liste / Harita geçişi */}
          <div className="inline-flex rounded-xl border border-slate-200 p-0.5 dark:border-ink-700" role="tablist" aria-label="Görünüm">
            {(
              [
                { key: 'list', label: 'Liste', icon: List },
                { key: 'map', label: 'Harita', icon: MapIcon },
              ] as const
            ).map((option) => (
              <button
                key={option.key}
                type="button"
                role="tab"
                aria-selected={view === option.key}
                onClick={() => setView(option.key)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  view === option.key
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-ink-300 dark:hover:bg-ink-800',
                )}
              >
                <option.icon className="size-4" aria-hidden />
                {option.label}
              </button>
            ))}
          </div>

          {/* Mobil filtre butonu */}
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setSheetOpen(true)}
          >
            <SlidersHorizontal className="size-4" aria-hidden />
            Filtreler
            {activeFilterCount > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[260px_1fr]">
        {/* Masaüstü filtre paneli */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-slate-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-5 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 dark:text-ink-50">Filtreler</h2>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  Temizle
                </button>
              )}
            </div>
            <VenueFilterFields filters={filters} onChange={applyFilters} />
          </div>
        </aside>

        {/* Sonuçlar */}
        <div>
          {isLoading && (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className="h-72" />
              ))}
            </div>
          )}
          {isError && (
            <EmptyState
              title="Bir şeyler ters gitti"
              description="Tesisler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin."
            />
          )}
          {venues && venues.length === 0 && (
            <EmptyState
              title="Tesis bulunamadı"
              description="Filtrelerinize uyan tesis yok. Filtreleri genişletmeyi deneyin."
              action={
                activeFilterCount > 0 ? (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Filtreleri Temizle
                  </Button>
                ) : undefined
              }
            />
          )}
          {venues && venues.length > 0 && view === 'list' && (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map(({ venue, distanceKm }) => (
                <VenueCard key={venue.id} venue={venue} distanceKm={distanceKm} />
              ))}
            </div>
          )}
          {venues && venues.length > 0 && view === 'map' && (
            <VenueMap venues={venues} userLocation={userLoc} className="h-[65dvh] min-h-96" />
          )}
        </div>
      </div>

      {/* Mobil filtre sheet */}
      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Filtreler" side="bottom">
        <VenueFilterFields filters={filters} onChange={applyFilters} />
        <div className="mt-5 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={clearFilters}>
            Temizle
          </Button>
          <Button className="flex-1" onClick={() => setSheetOpen(false)}>
            Sonuçları Göster
          </Button>
        </div>
      </Sheet>
    </Container>
  )
}
