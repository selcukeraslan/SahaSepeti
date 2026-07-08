import { useQuery } from '@tanstack/react-query'
import { getVenueBySlug } from '../services/venues.service'

export function useVenue(slug: string | undefined) {
  return useQuery({
    queryKey: ['venue', slug],
    queryFn: () => getVenueBySlug(slug ?? ''),
    enabled: Boolean(slug),
  })
}
