import { useQuery } from '@tanstack/react-query'
import { listVenues } from '../services/venues.service'
import type { VenueFilters } from '../types'

export function useVenues(filters: VenueFilters) {
  return useQuery({
    queryKey: ['venues', filters],
    queryFn: () => listVenues(filters),
  })
}
