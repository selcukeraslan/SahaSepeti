import { useQuery } from '@tanstack/react-query'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { listPanelVenues } from '../services/staff.service'
import type { PanelRole } from '../permissions'

export function usePanelAccess() {
  const { user } = useAuth()
  return useQuery({ queryKey: ['panel-access', user?.id], queryFn: listPanelVenues,
    enabled: Boolean(user), staleTime: 0, refetchInterval: 15_000, refetchOnWindowFocus: 'always', retry: false })
}
export function usePanelScope() {
  return useOutletContext<{ venueId: string; role: PanelRole } | null>()
}
