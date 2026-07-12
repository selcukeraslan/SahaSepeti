import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listVenueReviews, upsertReview } from '../services/reviews.service'

export function useVenueReviews(venueId: string | undefined) {
  return useQuery({
    queryKey: ['venue-reviews', venueId],
    queryFn: () => listVenueReviews(venueId as string),
    enabled: Boolean(venueId),
  })
}

export function useUpsertReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: upsertReview,
    onSuccess: (review) => {
      // Yorum listesi + kart ortalamaları tazelenir
      void queryClient.invalidateQueries({ queryKey: ['venue-reviews', review.venue_id] })
      void queryClient.invalidateQueries({ queryKey: ['venues'] })
      void queryClient.invalidateQueries({ queryKey: ['favorite-venues'] })
    },
  })
}
