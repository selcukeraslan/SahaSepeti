import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listSeriesOccurrences, manageSeries } from '../services/series.service'
import type { SeriesInput } from '../series.schemas'

export function useSeriesMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ input, preview }: { input: SeriesInput; preview: boolean }) => manageSeries(input, preview),
    onSuccess: (result) => {
      if (result.saved) {
        for (const key of ['owner-series', 'owner-reservations', 'owner-schedule', 'owner-stats', 'availability', 'my-reservations',
          'venue-customers', 'venue-customer', 'venue-customer-history']) {
          void queryClient.invalidateQueries({ queryKey: [key] })
        }
      }
    },
  })
}
export function useSeriesOccurrences(id: string) {
  return useQuery({ queryKey: ['owner-series', id], queryFn: () => listSeriesOccurrences(id) })
}
