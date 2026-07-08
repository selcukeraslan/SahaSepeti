import { useQuery } from '@tanstack/react-query'
import { listSports } from '../services/venues.service'

export function useSports() {
  return useQuery({
    queryKey: ['sports'],
    queryFn: listSports,
    staleTime: Infinity, // spor listesi oturum boyunca değişmez
  })
}
