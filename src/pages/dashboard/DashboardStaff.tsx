import { usePanelScope } from '@/features/staff/hooks/usePanelAccess'
import { StaffManager } from '@/features/staff/components/StaffManager'
import { EmptyState } from '@/components/ui/EmptyState'

export function DashboardStaff() {
  const scope = usePanelScope()
  if (!scope?.venueId) return <EmptyState title="Önce bir tesis ekleyin" description="Personel erişimleri tesis bazında yönetilir." />
  return <StaffManager key={`${scope.venueId}:${scope.role}`} venueId={scope.venueId} role={scope.role} />
}
