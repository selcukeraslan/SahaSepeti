import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/hooks/useAuth'
import {
  addFavorite,
  listFavoriteIds,
  listFavoriteVenues,
  removeFavorite,
} from '../services/favorites.service'

/** Favori tesis id'leri — kalp butonunun durumu için (yalnızca müşteride çalışır). */
export function useFavoriteIds() {
  const { profile } = useAuth()
  return useQuery({
    queryKey: ['favorites'],
    queryFn: listFavoriteIds,
    enabled: profile?.role === 'customer',
  })
}

/** Favorilerim sayfası için tam tesis kartı verisi. */
export function useFavoriteVenues() {
  return useQuery({
    queryKey: ['favorite-venues'],
    queryFn: listFavoriteVenues,
  })
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ venueId, isFavorite }: { venueId: string; isFavorite: boolean }) =>
      isFavorite ? removeFavorite(venueId) : addFavorite(venueId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['favorites'] })
      void queryClient.invalidateQueries({ queryKey: ['favorite-venues'] })
    },
  })
}
