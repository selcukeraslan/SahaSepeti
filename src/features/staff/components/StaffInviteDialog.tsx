import { useState } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/useToast'
import { useManageStaff } from '../hooks/useStaff'
import { STAFF_ROLE_LABELS, staffRoleSchema } from '../schemas'
import { ROLE_DESCRIPTIONS, type PanelRole } from '../permissions'
import type { StaffRole } from '@/types/database.types'

export function StaffInviteDialog({ venueId, role, onClose, initialEmail = '', initialRole = 'reception' }: {
  venueId: string; role: PanelRole; onClose: () => void; initialEmail?: string; initialRole?: StaffRole
}) {
  const mutation = useManageStaff()
  const { toast } = useToast()
  const [email, setEmail] = useState(initialEmail)
  const [staffRole, setRole] = useState<StaffRole>(initialRole)
  const [link, setLink] = useState('')
  const close = () => { if (!mutation.isPending) { mutation.reset(); onClose() } }
  return <Dialog open onClose={close} title={initialEmail ? 'Davet bağlantısını yenile' : 'Personel davet et'}>
    {link ? <div className="space-y-4">
      <p className="text-sm">Davet 7 gün geçerlidir. Bağlantıyı yalnızca davet edilen kişiyle paylaşın. E-posta otomatik gönderilmedi.</p>
      <Input aria-label="Davet bağlantısı" value={link} readOnly onFocus={e => e.target.select()} />
      <Button onClick={async () => { try { await navigator.clipboard.writeText(link); toast('Bağlantı kopyalandı', 'success') }
        catch { toast('Otomatik kopyalanamadı; bağlantıyı seçip kopyalayın', 'error') } }}>Bağlantıyı Kopyala</Button>
    </div> : <form className="space-y-4" onSubmit={event => {
      event.preventDefault()
      if (mutation.isPending) return
      mutation.mutate({ action: 'invite', venueId, email, role: staffRole }, { onSuccess: result => {
        if (result) setLink(`${window.location.origin}/personel-davet#${result.token}`)
        toast('Davet bağlantısı oluşturuldu', 'success')
      }, onError: error => toast(error.message, 'error') })
    }}>
      <Input label="E-posta" type="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} />
      <Select aria-label="Personel rolü" value={staffRole} onChange={e => setRole(staffRoleSchema.parse(e.target.value))}
        options={Object.entries(STAFF_ROLE_LABELS).filter(([key]) => role !== 'manager' || key !== 'manager').map(([value,label]) => ({ value,label }))} />
      <p className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-ink-800">{ROLE_DESCRIPTIONS[staffRole]}</p>
      {initialEmail && <p className="text-sm text-amber-600">Önceki bağlantı iptal edilir. Yeni bağlantıyı tekrar paylaşmanız gerekir.</p>}
      <Button type="submit" isLoading={mutation.isPending}>Davet Bağlantısı Oluştur</Button>
    </form>}
  </Dialog>
}
