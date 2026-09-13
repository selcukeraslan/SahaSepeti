import { useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { QueryErrorState } from '@/components/ui/QueryErrorState'
import { useToast } from '@/components/ui/useToast'
import { useManageStaff, useStaff, useStaffInvites } from '../hooks/useStaff'
import { STAFF_ROLE_LABELS, staffRoleSchema, type StaffAction } from '../schemas'
import { ROLE_DESCRIPTIONS, type PanelRole } from '../permissions'
import { StaffInviteDialog } from './StaffInviteDialog'
import type { StaffRole } from '@/types/database.types'

export function StaffManager({ venueId, role }: { venueId: string; role: PanelRole }) {
  const staff = useStaff(venueId)
  const invites = useStaffInvites(venueId)
  const mutation = useManageStaff()
  const { user } = useAuth()
  const { toast } = useToast()
  const [invite, setInvite] = useState<{ email: string; role: StaffRole } | null>(null)
  const [action, setAction] = useState<StaffAction | null>(null)
  const privileged = role === 'owner' || role === 'admin'
  const closeAction = () => { if (!mutation.isPending) setAction(null) }
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold">Personel</h1><p className="mt-1 text-sm text-slate-500">Hesabınızı paylaşmadan, seçili tesise erişim verin.</p></div>
      <Button onClick={() => setInvite({ email: '', role: 'reception' })}>Personel Davet Et</Button>
    </div>
    {(staff.isPending || invites.isPending) && <Skeleton className="h-40" />}
    {(staff.isError || invites.isError) && <QueryErrorState title="Personel bilgileri yüklenemedi" isRetrying={staff.isFetching || invites.isFetching}
      onRetry={() => { void staff.refetch(); void invites.refetch() }} />}
    {staff.data?.length === 0 && <EmptyState title="Henüz personel yok" description="Bir davet bağlantısı oluşturarak başlayın." />}
    {staff.data?.map(person => <div key={person.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4 dark:border-ink-800">
      <div><p className="font-semibold">{person.full_name || 'Personel'}</p><p className="text-sm text-primary-600">{STAFF_ROLE_LABELS[person.role]}</p></div>
      {person.user_id !== user?.id && (privileged || person.role !== 'manager') && <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setAction({ action: 'change_role', venueId, id: person.id, role: person.role })}>Rol Değiştir</Button>
        <Button variant="danger" size="sm" onClick={() => setAction({ action: 'remove', venueId, id: person.id })}>Erişimi Kaldır</Button>
      </div>}
    </div>)}
    <h2 className="text-lg font-semibold">Bekleyen Davetler</h2>
    {invites.data?.length === 0 && <p className="text-sm text-slate-500">Bekleyen davet yok.</p>}
    {invites.data?.map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4 dark:border-ink-800">
      <div><p className="font-medium">{item.email}</p><p className="text-sm text-slate-500">{STAFF_ROLE_LABELS[item.role]} · {Date.parse(item.expires_at) <= Date.now() ? 'Süresi doldu' : 'Kabul bekliyor'}</p></div>
      {(privileged || item.role !== 'manager') && <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setInvite({ email: item.email, role: item.role })}>Bağlantıyı Yenile</Button>
        <Button size="sm" variant="ghost" onClick={() => setAction({ action: 'revoke_invite', venueId, id: item.id })}>İptal Et</Button>
      </div>}
    </div>)}
    {invite && <StaffInviteDialog venueId={venueId} role={role} initialEmail={invite.email} initialRole={invite.role} onClose={() => setInvite(null)} />}
    {action && <Dialog open title="Yetki değişikliğini onayla" onClose={closeAction}>
      {action.action === 'change_role' ? <div className="space-y-3">
        <Select aria-label="Yeni rol" value={action.role} onChange={e => setAction({ ...action, role: staffRoleSchema.parse(e.target.value) })}
          options={Object.entries(STAFF_ROLE_LABELS).filter(([key]) => privileged || key !== 'manager').map(([value,label]) => ({ value,label }))} />
        <p className="text-sm">{ROLE_DESCRIPTIONS[action.role]}</p>
      </div> : <p className="text-sm">{action.action === 'remove' ? 'Personelin bu tesisteki erişimi kaldırılacak. Diğer tesislerdeki erişimi değişmez.' : 'Bu davet bağlantısı artık kullanılamayacak.'}</p>}
      <div className="mt-5 flex justify-end gap-2"><Button variant="outline" disabled={mutation.isPending} onClick={closeAction}>Vazgeç</Button>
        <Button isLoading={mutation.isPending} onClick={() => { if (!mutation.isPending) mutation.mutate(action, {
          onSuccess: () => { setAction(null); toast('Personel yetkileri güncellendi', 'success') }, onError: error => toast(error.message, 'error'),
        }) }}>Onayla</Button></div>
    </Dialog>}
  </div>
}
