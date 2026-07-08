import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { VenueStatus } from '@/types/database.types'
import {
  approveVenue,
  listAllReservations,
  listAllVenues,
  rejectVenue,
  suspendVenue,
  type AdminReservationFilters,
} from '../services/admin.service'

export function useAdminVenues(status?: VenueStatus) {
  return useQuery({
    queryKey: ['admin-venues', status ?? 'all'],
    queryFn: () => listAllVenues(status),
  })
}

export function useAdminVenueMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin-venues'] })
    void queryClient.invalidateQueries({ queryKey: ['venues'] })
  }

  const approve = useMutation({
    mutationFn: (venueId: string) => approveVenue(venueId),
    onSuccess: invalidate,
  })
  const reject = useMutation({
    mutationFn: ({ venueId, reason }: { venueId: string; reason: string }) =>
      rejectVenue(venueId, reason),
    onSuccess: invalidate,
  })
  const suspend = useMutation({
    mutationFn: (venueId: string) => suspendVenue(venueId),
    onSuccess: invalidate,
  })

  return { approve, reject, suspend }
}

export function useAdminReservations(filters: AdminReservationFilters) {
  return useQuery({
    queryKey: ['admin-reservations', filters],
    queryFn: () => listAllReservations(filters),
  })
}
