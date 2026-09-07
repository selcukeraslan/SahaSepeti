import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/useToast'
import { SeriesReview } from './SeriesReview'
import type { SeriesInput } from '../series.schemas'
import { CustomerPicker, type SelectedCustomer } from './CustomerPicker'

export interface ManualReservationFields {
  venueCustomerId?: string
  guestName: string
  guestPhone?: string
  notes?: string
}

export function ManualReservationForm({
  isSaving,
  onSubmit,
  seriesContext,
  onSeriesSaved,
}: {
  isSaving: boolean
  onSubmit: (fields: ManualReservationFields) => void
  seriesContext?: { venueId: string; courtId: string; date: string; startTime: string; endTime: string }
  onSeriesSaved?: () => void
}) {
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [repeat, setRepeat] = useState(false)
  const [weeks, setWeeks] = useState(4)
  const [seriesBusy, setSeriesBusy] = useState(false)
  const [selected, setSelected] = useState<SelectedCustomer | null>(null)
  const [oneOff, setOneOff] = useState(false)
  const ready = !seriesContext || oneOff || Boolean(selected)
  const selectCustomer = (customer: SelectedCustomer) => {
    setSelected(customer); setGuestName(customer.name); setGuestPhone(''); setOneOff(false)
  }
  const seriesInput: SeriesInput | null = seriesContext ? {
    ...seriesContext, action: 'create', weeks, name: guestName.trim(),
    guestName: guestName.trim(), guestPhone: guestPhone.trim(), notes: notes.trim(),
    venueCustomerId: selected?.id,
  } : null
  const { toast } = useToast()

  const handleSubmit = () => {
    if (selected?.blocked) { toast('Müşteri kara listede; rezervasyon oluşturulamaz', 'error'); return }
    if (guestName.trim().length < 2) {
      toast('Müşteri adını girin', 'error')
      return
    }
    onSubmit({
      venueCustomerId: selected?.id,
      guestName: guestName.trim(),
      guestPhone: guestPhone.trim() || undefined,
      notes: notes.trim() || undefined,
    })
  }

  return (
    <div className="mt-4 space-y-3">
      <fieldset disabled={isSaving || seriesBusy} className="space-y-3">
      {seriesContext && !oneOff && !selected && <>
        <CustomerPicker venueId={seriesContext.venueId} onSelect={selectCustomer} />
        <Button size="sm" variant="ghost" onClick={() => setOneOff(true)}>Tek seferlik misafir kaydı</Button>
      </>}
      {selected && <div className="space-y-2 rounded-xl border border-slate-200 p-3 dark:border-ink-800">
        <p className="font-semibold">{selected.name}</p>
        {selected.blocked && <p role="alert" className="text-sm text-red-600 dark:text-red-400">Müşteri kara listede. Rehberden kara liste durumunu kaldırmadan rezervasyon yapamazsınız.</p>}
        <Button size="sm" variant="ghost" onClick={() => { setSelected(null); setGuestName(''); setRepeat(false) }}>Müşteriyi Değiştir</Button>
      </div>}
      {(!seriesContext || oneOff) && <>
      <Input label="Müşteri adı" placeholder="Örn. Ahmet Yılmaz" maxLength={80} disabled={isSaving} value={guestName} onChange={(event) => setGuestName(event.target.value)} />
      <Input label="Telefon (isteğe bağlı)" type="tel" placeholder="0555 555 55 55" disabled={isSaving} value={guestPhone} onChange={(event) => setGuestPhone(event.target.value)} />
      {seriesContext && <Button size="sm" variant="ghost" onClick={() => { setOneOff(false); setRepeat(false) }}>Rehberden Seç</Button>}
      </>}
      {ready && <Textarea label="Not (isteğe bağlı)" placeholder="Rezervasyon notu..." maxLength={500} disabled={isSaving} value={notes} onChange={(event) => setNotes(event.target.value)} />}
      {seriesContext && ready && !selected?.blocked && <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={repeat} onChange={(event) => setRepeat(event.target.checked)} />
        Her hafta tekrarla
      </label>}
      {repeat && ready && !selected?.blocked && <Input label="Kaç hafta? (ilk hafta dahil)" type="number" min={1} max={52}
        value={weeks} onChange={(event) => setWeeks(Number(event.target.value))} />}
      </fieldset>
      {ready && !selected?.blocked && (repeat && seriesInput ? <SeriesReview key={JSON.stringify(seriesInput)} input={seriesInput}
        onBusy={setSeriesBusy} onSaved={() => onSeriesSaved?.()} />
        : <Button className="w-full" isLoading={isSaving} onClick={handleSubmit}>Rezervasyonu Ekle</Button>)}
    </div>
  )
}
