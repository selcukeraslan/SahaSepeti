import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReservationStatus } from '@/types/database.types'
import {
  createBlockSlot,
  createCourt,
  createManualReservation,
  createPriceRule,
  createVenue,
  deleteOwnerReservation,
  deletePriceRule,
  getOpeningHours,
  listCourtPriceRules,
  listMyVenues,
  listOwnerDaySchedule,
  listOwnerReservations,
  listOwnerReservationsForStats,
  listVenueCourts,
  saveOpeningHours,
  setCourtActive,
  setReservationNoShow,
  submitVenueForApproval,
  updateCourt,
  updateReservationStatus,
  updateVenue,
  type OwnerReservationFilters,
} from '../services/dashboard.service'
import type {
  BlockSlotInput,
  CourtInput,
  ManualReservationInput,
  OpeningHourInput,
  PriceRuleInput,
  VenueInput,
} from '../schemas'

export function useMyVenues() {
  return useQuery({ queryKey: ['my-venues'], queryFn: listMyVenues })
}

export function useVenueMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['my-venues'] })
    void queryClient.invalidateQueries({ queryKey: ['venues'] })
    void queryClient.invalidateQueries({ queryKey: ['venue'] })
  }

  const create = useMutation({
    mutationFn: (input: VenueInput) => createVenue(input),
    onSuccess: invalidate,
  })
  const update = useMutation({
    mutationFn: ({ venueId, input }: { venueId: string; input: VenueInput }) =>
      updateVenue(venueId, input),
    onSuccess: invalidate,
  })
  const submit = useMutation({
    mutationFn: (venueId: string) => submitVenueForApproval(venueId),
    onSuccess: invalidate,
  })

  return { create, update, submit }
}

export function useVenueCourts(venueId: string | undefined) {
  return useQuery({
    queryKey: ['venue-courts', venueId],
    queryFn: () => listVenueCourts(venueId ?? ''),
    enabled: Boolean(venueId),
  })
}

export function useCourtMutations(venueId: string | undefined) {
  const queryClient = useQueryClient()
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['venue-courts', venueId] })
    void queryClient.invalidateQueries({ queryKey: ['venue'] })
    void queryClient.invalidateQueries({ queryKey: ['availability'] })
  }

  const create = useMutation({
    mutationFn: (input: CourtInput) => createCourt(venueId ?? '', input),
    onSuccess: invalidate,
  })
  const update = useMutation({
    mutationFn: ({ courtId, input }: { courtId: string; input: CourtInput }) =>
      updateCourt(courtId, input),
    onSuccess: invalidate,
  })
  const toggleActive = useMutation({
    mutationFn: ({ courtId, isActive }: { courtId: string; isActive: boolean }) =>
      setCourtActive(courtId, isActive),
    onSuccess: invalidate,
  })

  return { create, update, toggleActive }
}

export function useOpeningHours(venueId: string | undefined) {
  return useQuery({
    queryKey: ['opening-hours', venueId],
    queryFn: () => getOpeningHours(venueId ?? ''),
    enabled: Boolean(venueId),
  })
}

export function useSaveOpeningHours(venueId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (hours: OpeningHourInput[]) => saveOpeningHours(venueId ?? '', hours),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['opening-hours', venueId] })
      void queryClient.invalidateQueries({ queryKey: ['venue'] })
      void queryClient.invalidateQueries({ queryKey: ['availability'] })
    },
  })
}

export function useCourtPriceRules(courtId: string | undefined) {
  return useQuery({
    queryKey: ['price-rules', courtId],
    queryFn: () => listCourtPriceRules(courtId ?? ''),
    enabled: Boolean(courtId),
  })
}

export function usePriceRuleMutations(courtId: string | undefined) {
  const queryClient = useQueryClient()
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['price-rules', courtId] })
    void queryClient.invalidateQueries({ queryKey: ['venue'] })
    void queryClient.invalidateQueries({ queryKey: ['availability'] })
  }

  const create = useMutation({
    mutationFn: (input: PriceRuleInput) => createPriceRule(courtId ?? '', input),
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: (ruleId: string) => deletePriceRule(ruleId),
    onSuccess: invalidate,
  })

  return { create, remove }
}

export function useOwnerReservations(filters: OwnerReservationFilters) {
  return useQuery({
    queryKey: ['owner-reservations', filters],
    queryFn: () => listOwnerReservations(filters),
  })
}

export function useOwnerStats(venueId?: string) {
  return useQuery({
    queryKey: ['owner-stats', venueId ?? 'all'],
    queryFn: () => listOwnerReservationsForStats(venueId),
  })
}

export function useUpdateReservationStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      reservationId,
      status,
    }: {
      reservationId: string
      status: ReservationStatus
    }) => updateReservationStatus(reservationId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['owner-reservations'] })
      void queryClient.invalidateQueries({ queryKey: ['owner-schedule'] })
      void queryClient.invalidateQueries({ queryKey: ['availability'] })
    },
  })
}

// ---------- Takvim / manuel rezervasyon / blok / no-show ----------

export function useOwnerDaySchedule(venueId: string | undefined, date: string) {
  return useQuery({
    queryKey: ['owner-schedule', venueId ?? '', date],
    queryFn: () => listOwnerDaySchedule(venueId ?? '', date),
    enabled: Boolean(venueId),
  })
}

/** Manuel rezervasyon, blok, silme ve no-show — hepsi takvimi + rezervasyonları tazeler. */
export function useScheduleMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['owner-schedule'] })
    void queryClient.invalidateQueries({ queryKey: ['owner-reservations'] })
    void queryClient.invalidateQueries({ queryKey: ['availability'] })
  }

  const addManual = useMutation({
    mutationFn: (input: ManualReservationInput) => createManualReservation(input),
    onSuccess: invalidate,
  })
  const addBlock = useMutation({
    mutationFn: (input: BlockSlotInput) => createBlockSlot(input),
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: (reservationId: string) => deleteOwnerReservation(reservationId),
    onSuccess: invalidate,
  })
  const setNoShow = useMutation({
    mutationFn: ({ reservationId, value }: { reservationId: string; value: boolean }) =>
      setReservationNoShow(reservationId, value),
    onSuccess: invalidate,
  })

  return { addManual, addBlock, remove, setNoShow }
}
