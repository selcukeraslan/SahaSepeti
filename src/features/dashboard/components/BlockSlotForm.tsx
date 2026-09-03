import { useState } from 'react'
import { Wrench } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'

export function BlockSlotForm({
  isSaving,
  onSubmit,
}: {
  isSaving: boolean
  onSubmit: (reason?: string) => void
}) {
  const [reason, setReason] = useState('')

  return (
    <div className="mt-4 space-y-3">
      <Textarea label="Açıklama (isteğe bağlı)" placeholder="Bakım, özel etkinlik..." maxLength={200} disabled={isSaving} value={reason} onChange={(event) => setReason(event.target.value)} />
      <Button variant="secondary" className="w-full" isLoading={isSaving} onClick={() => onSubmit(reason.trim() || undefined)}>
        <Wrench className="size-4" aria-hidden />
        Saati Blokla
      </Button>
    </div>
  )
}
