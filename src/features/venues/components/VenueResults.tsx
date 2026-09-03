import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { QueryErrorState } from '@/components/ui/QueryErrorState'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import type { GeoPoint } from '@/lib/geo'
import { isVenueSort, VENUE_SORT_OPTIONS, type VenueFilters, type VenueListItem } from '../types'
import { VenueCard } from './VenueCard'
import { VenueMap } from './VenueMap'
import type { VenueListView } from './VenueListToolbar'

export interface VenueResultItem {
  venue: VenueListItem
  distanceKm: number | null
}

interface VenueResultsProps {
  venues: VenueListItem[] | undefined
  displayVenues: VenueResultItem[]
  filters: VenueFilters
  view: VenueListView
  userLocation: GeoPoint | null
  isLoading: boolean
  isError: boolean
  isRetrying: boolean
  activeFilterCount: number
  onFiltersChange: (filters: VenueFilters) => void
  onClearFilters: () => void
  onRetry: () => void
}

export function VenueResults({
  venues,
  displayVenues,
  filters,
  view,
  userLocation,
  isLoading,
  isError,
  isRetrying,
  activeFilterCount,
  onFiltersChange,
  onClearFilters,
  onRetry,
}: VenueResultsProps) {
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <div className="w-full sm:w-56">
          <Select
            aria-label="Sıralama"
            placeholder="Önerilen"
            value={filters.sort ?? ''}
            onChange={(event) => {
              const value = event.target.value
              onFiltersChange({ ...filters, sort: isVenueSort(value) ? value : undefined })
            }}
            options={VENUE_SORT_OPTIONS}
          />
        </div>
      </div>
      {isLoading && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-80 rounded-3xl" />)}
        </div>
      )}
      {isError && (
        <QueryErrorState
          description="Tesisler yüklenirken bir hata oluştu. Lütfen tekrar deneyin."
          isRetrying={isRetrying}
          onRetry={onRetry}
        />
      )}
      {venues && venues.length === 0 && (
        <EmptyState
          title="Tesis bulunamadı"
          description="Filtrelerinize uyan tesis yok. Filtreleri genişletmeyi deneyin."
          action={activeFilterCount > 0 ? <Button variant="outline" size="sm" onClick={onClearFilters}>Filtreleri Temizle</Button> : undefined}
        />
      )}
      {venues && venues.length > 0 && view === 'list' && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {displayVenues.map(({ venue, distanceKm }) => (
            <VenueCard key={venue.id} venue={venue} distanceKm={distanceKm} selectedDate={filters.date} />
          ))}
        </div>
      )}
      {venues && venues.length > 0 && view === 'map' && (
        <VenueMap venues={venues} userLocation={userLocation} className="h-[65dvh] min-h-96" />
      )}
    </div>
  )
}
