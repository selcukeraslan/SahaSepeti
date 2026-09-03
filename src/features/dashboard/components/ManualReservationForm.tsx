import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/useToast'

export interface ManualReservationFields {
  guestName: string
  guestPhone?: string
  notes?: string
}

export function ManualReservationForm({
  isSaving,
  onSubmit,
}: {
  isSaving: boolean
  onSubmit: (fields: ManualReservationFields) => void
}) {
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [notes, setNotes] = useState('')
  const { toast } = useToast()

  const handleSubmit = () => {
    if (guestName.trim().length < 2) {
      toast('Müşteri adını girin', 'error')
      return
    }
    onSubmit({
      guestName: guestName.trim(),
      guestPhone: guestPhone.trim() || undefined,
      notes: notes.trim() || undefined,
    })
  }

  return (
    <div className="mt-4 space-y-3">
      <Input label="Müşteri adı" placeholder="Örn. Ahmet Yılmaz" maxLength={80} disabled={isSaving} value={guestName} onChange={(event) => setGuestName(event.target.value)} />
      <Input label="Telefon (isteğe bağlı)" type="tel" placeholder="0555 555 55 55" disabled={isSaving} value={guestPhone} onChange={(event) => setGuestPhone(event.target.value)} />
      <Textarea label="Not (isteğe bağlı)" placeholder="Telefonla alındı, peşin ödendi..." maxLength={500} disabled={isSaving} value={notes} onChange={(event) => setNotes(event.target.value)} />
      <Button className="w-full" isLoading={isSaving} onClick={handleSubmit}>Rezervasyonu Ekle</Button>
    </div>
  )
}
