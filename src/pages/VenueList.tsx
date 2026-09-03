import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Container } from '@/components/layout/Container'
import { PublicPageHero } from '@/components/layout/PublicPageHero'
import { Seo } from '@/components/Seo'
import { useToast } from '@/components/ui/useToast'
import { VenueFilterSidebar } from '@/features/venues/components/VenueFilterSidebar'
import { VenueListToolbar, type VenueListView } from '@/features/venues/components/VenueListToolbar'
import { VenueMobileFilters } from '@/features/venues/components/VenueMobileFilters'
import { VenueResults, type VenueResultItem } from '@/features/venues/components/VenueResults'
import { useVenues } from '@/features/venues/hooks/useVenues'
import { sortVenues } from '@/features/venues/services/sorting'
import { isVenueSort, type VenueFilters, type VenueListItem } from '@/features/venues/types'
import { distanceToOrNull, type GeoPoint } from '@/lib/geo'

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

function orderVenues(venues: VenueListItem[], sort: VenueFilters['sort'], from: GeoPoint | null): VenueResultItem[] {
  const withDistance = venues.map((venue) => ({
    venue,
    distanceKm: from ? distanceToOrNull(venue, from) : null,
  }))
  if (sort) {
    const distanceByVenue = new Map(withDistance.map((item) => [item.venue.id, item.distanceKm]))
    return sortVenues(venues, sort).map((venue) => ({
      venue,
      distanceKm: distanceByVenue.get(venue.id) ?? null,
    }))
  }
  if (from) {
    return [...withDistance].sort((a, b) => {
      if (a.distanceKm === null) return 1
      if (b.distanceKm === null) return -1
      return a.distanceKm - b.distanceKm
    })
  }
  return withDistance
}

export function VenueList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [view, setView] = useState<VenueListView>('list')
  const [userLoc, setUserLoc] = useState<GeoPoint | null>(null)
  const [locating, setLocating] = useState(false)
  const { toast } = useToast()
  const filters = useMemo(() => paramsToFilters(searchParams), [searchParams])
  const queryFilters = useMemo(() => {
    const { sort: _sort, ...rest } = filters
    return rest
  }, [filters])
  const { data: venues, isLoading, isError, isFetching, refetch } = useVenues(queryFilters)
  const displayVenues = useMemo(
    () => orderVenues(venues ?? [], filters.sort, userLoc),
    [venues, filters.sort, userLoc],
  )

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
  const clearFilters = () => {
    const params = new URLSearchParams()
    if (filters.sort) params.set('sort', filters.sort)
    setSearchParams(params, { replace: true })
  }
  const activeFilterCount = [filters.sport, filters.city, filters.district, filters.date, filters.q].filter(Boolean).length
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
  const listTitle = filters.city ? `${filters.city} Spor Tesisleri` : 'Spor Tesisleri'

  return (
    <>
      <Seo title={listTitle} description={`${filters.city ?? "Türkiye'de"} spor tesislerini keşfet, müsait saatleri gör ve online rezervasyon yap.`} canonicalPath="/tesisler" />
      <PublicPageHero
        eyebrow="Tesisleri keşfet"
        title={listTitle}
        description="Konumuna, sporuna ve tarihine uygun sahaları karşılaştır; sana en uygun saati seç."
        aside={<div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200">{venues ? `${venues.length} tesis bulundu` : 'Tesisler yükleniyor...'}</div>}
      />
      <section className="bg-[#fafbf8] py-8 dark:bg-ink-950 sm:py-10">
        <Container>
          <VenueListToolbar activeFilterCount={activeFilterCount} isNearMe={userLoc !== null} locating={locating} view={view} onToggleNearMe={toggleNearMe} onViewChange={setView} onOpenFilters={() => setSheetOpen(true)} />
          <div className="mt-5 grid gap-8 lg:grid-cols-[280px_1fr]">
            <VenueFilterSidebar filters={filters} activeFilterCount={activeFilterCount} onChange={applyFilters} onClear={clearFilters} />
            <VenueResults venues={venues} displayVenues={displayVenues} filters={filters} view={view} userLocation={userLoc} isLoading={isLoading} isError={isError} isRetrying={isFetching} activeFilterCount={activeFilterCount} onFiltersChange={applyFilters} onClearFilters={clearFilters} onRetry={() => { void refetch() }} />
          </div>
        </Container>
      </section>
      <VenueMobileFilters open={sheetOpen} filters={filters} onChange={applyFilters} onClear={clearFilters} onClose={() => setSheetOpen(false)} />
    </>
  )
}
