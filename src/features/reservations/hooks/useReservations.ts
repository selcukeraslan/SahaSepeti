import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cancelReservation,
  createReservation,
  listMyReservations,
} from '../services/reservations.service'

export function useMyReservations() {
  return useQuery({
    queryKey: ['my-reservations'],
    queryFn: listMyReservations,
  })
}

export function useCreateReservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createReservation,
    // Hata durumunda da (örn. "bu saat az önce doldu") müsaitlik tazelenir
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['availability'] })
      void queryClient.invalidateQueries({ queryKey: ['my-reservations'] })
    },
  })
}

export function useCancelReservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cancelReservation,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['availability'] })
      void queryClient.invalidateQueries({ queryKey: ['my-reservations'] })
    },
  })
}
