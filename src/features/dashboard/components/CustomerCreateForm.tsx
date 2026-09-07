import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/useToast'
import type { VenueCustomerRow } from '@/types/database.types'
import { useSaveCustomer } from '../hooks/useCustomers'

export function CustomerCreateForm({ venueId, onSaved }: { venueId: string; onSaved: (row: VenueCustomerRow) => void }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const mutation = useSaveCustomer()
  const { toast } = useToast()
  return <div className="space-y-3 rounded-xl border border-slate-200 p-3 dark:border-ink-800">
    <Input label="Müşteri adı" maxLength={80} value={name} disabled={mutation.isPending} onChange={(e) => setName(e.target.value)} />
    <Input label="Türkiye telefonu" type="tel" maxLength={30} placeholder="0555 123 45 67" value={phone}
      disabled={mutation.isPending} onChange={(e) => setPhone(e.target.value)} />
    <Button isLoading={mutation.isPending} onClick={() => mutation.mutate({ action: 'create', venueId, name, phone }, {
      onSuccess: (row) => { toast('Müşteri kaydı hazır', 'success'); onSaved(row) },
      onError: (error) => toast(error.message, 'error'),
    })}>Müşteriyi Kaydet ve Seç</Button>
    <p className="text-xs text-slate-500 dark:text-ink-400">Telefon rehberde varsa mevcut kayıt seçilir; ikinci kayıt oluşturulmaz.</p>
  </div>
}
