import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Sheet } from '@/components/ui/Sheet'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { VenueCard } from '@/features/venues/components/VenueCard'
import { VenueFilterFields } from '@/features/venues/components/VenueFilterFields'
import { useVenues } from '@/features/venues/hooks/useVenues'
import {
  isVenueSort,
  VENUE_SORT_OPTIONS,
  type VenueFilters,
} from '@/features/venues/types'

function paramsToFilters(params: URLSearchParams): VenueFilters {
  const sortParam = params.get('sort')
  return {
    city: params.get('city') ?? undefined,
    district: params.get('district') ?? undefined,
    sport: params.get('sport') ?? undefined,
    date: params.get('date') ?? undefined,
    q: params.get('q') ?? undefined,
    sort: isVenueSort(sortParam) ? sortParam : undefined,
  }
}

export function VenueList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [sheetOpen, setSheetOpen] = useState(false)

  const filters = useMemo(() => paramsToFilters(searchParams), [searchParams])
  const { data: venues, isLoading, isError } = useVenues(filters)

  const applyFilters = (next: VenueFilters) => {
    const params = new URLSearchParams()
    if (next.sport) params.set('sport', next.sport)
    if (next.city) params.set('city', next.city)
    if (next.district) params.set('district', next.district)
    if (next.date) params.set('date', next.date)
    if (next.q) params.set('q', next.q)
    if (next.sort) params.set('sort', next.sort)
    setSearchParams(params, { replace: true })
  }

  const clearFilters = () => setSearchParams(new URLSearchParams(), { replace: true })

  const activeFilterCount = [filters.sport, filters.city, filters.district, filters.q].filter(
    Boolean,
  ).length

  return (
    <Container className="py-8 sm:py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-ink-50 sm:text-3xl">Spor Tesisleri</h1>
          <p className="mt-1 text-slate-500 dark:text-ink-400">
            {venues ? `${venues.length} tesis bulundu` : 'Tesisler yükleniyor...'}
          </p>
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
          {/* Sıralama */}
          <div className="mb-4 flex justify-end">
            <div className="w-full sm:w-56">
              <Select
                aria-label="Sıralama"
                placeholder="Önerilen"
                value={filters.sort ?? ''}
                onChange={(event) => {
                  const value = event.target.value
                  applyFilters({ ...filters, sort: isVenueSort(value) ? value : undefined })
                }}
                options={VENUE_SORT_OPTIONS}
              />
            </div>
          </div>

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
          {venues && venues.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {venues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
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
