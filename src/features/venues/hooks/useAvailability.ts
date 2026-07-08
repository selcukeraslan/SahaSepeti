import { useQuery } from '@tanstack/react-query'
import { parseISO } from 'date-fns'
import { fetchBookedSlots } from '../services/availability.service'
import { generateSlots, nowInIstanbul, type TimeSlot } from '../services/slots'
import type { VenueDetail } from '../types'

export interface CourtAvailability {
  courtId: string
  slots: TimeSlot[]
}

/** Seçilen tarih için tesisin tüm sahalarının slot durumunu üretir. */
export function useAvailability(venue: VenueDetail | null | undefined, date: string) {
  return useQuery({
    queryKey: ['availability', venue?.id, date],
    enabled: Boolean(venue),
    // Doluluk anlık değişebilir — kısa stale süresi
    staleTime: 15_000,
    refetchInterval: 60_000,
    queryFn: async (): Promise<CourtAvailability[]> => {
      if (!venue) return []
      const booked = await fetchBookedSlots(venue.id, date)
      const dayOfWeek = parseISO(date).getDay()
      const now = nowInIstanbul()
      const nowMinutes = now.date === date ? now.minutes : null
      const openingHour = venue.openingHours.find((hour) => hour.day_of_week === dayOfWeek)

      return venue.courts.map((court) => ({
        courtId: court.id,
        slots: generateSlots({
          openingHour,
          priceRules: court.priceRules,
          bookedRanges: booked.filter((range) => range.court_id === court.id),
          dayOfWeek,
          nowMinutes,
        }),
      }))
    },
  })
}
