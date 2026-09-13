import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { acceptStaffInvite, listStaff, listStaffInvites, manageStaff } from '../services/staff.service'

export function useStaff(venueId: string) {
  const { user } = useAuth()
  return useQuery({ queryKey: ['staff', user?.id, venueId], queryFn: () => listStaff(venueId),
    enabled: Boolean(user && venueId), staleTime: 0, refetchOnWindowFocus: 'always' })
}

export function useStaffInvites(venueId: string) {
  const { user } = useAuth()
  return useQuery({ queryKey: ['staff-invites', user?.id, venueId], queryFn: () => listStaffInvites(venueId),
    enabled: Boolean(user && venueId), staleTime: 0, refetchOnWindowFocus: 'always' })
}

export function useManageStaff() {
  const cache = useQueryClient()
  return useMutation({ mutationFn: manageStaff, retry: false, gcTime: 0, onSuccess: async () => {
    await Promise.all(['staff', 'staff-invites', 'panel-access'].map(key => cache.invalidateQueries({ queryKey: [key] })))
  } })
}

export function useAcceptStaffInvite() {
  const cache = useQueryClient()
  return useMutation({ mutationFn: acceptStaffInvite, retry: false, gcTime: 0,
    onSuccess: async () => { await cache.invalidateQueries({ queryKey: ['panel-access'] }) } })
}
