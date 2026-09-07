import { useState } from 'react'
import { Repeat } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { QueryErrorState } from '@/components/ui/QueryErrorState'
import { formatDateShort, formatTime } from '@/lib/format'
import { RESERVATION_STATUS_LABELS } from '@/features/reservations/types'
import { useSeriesOccurrences } from '../hooks/useSeries'
import type { SeriesInput } from '../series.schemas'
import { SeriesReview } from './SeriesReview'

function SeriesManagerContent({ seriesId, reservationId, onSaved }: {
  seriesId: string; reservationId: string; onSaved: () => void
}) {
  const [scope, setScope] = useState<'one' | 'following' | 'all'>('one')
  const [action, setAction] = useState<'update' | 'cancel'>('cancel')
  const [startTime, setStartTime] = useState('20:00')
  const [endTime, setEndTime] = useState('21:00')
  const [busy, setBusy] = useState(false)
  const { data, isLoading, isError, isFetching, refetch } = useSeriesOccurrences(seriesId)
  const input: SeriesInput = action === 'cancel' ? { action, scope, reservationId }
    : { action, scope, reservationId, startTime, endTime }
  return <div className="space-y-4">
    {isLoading && <Skeleton className="h-24" />}
    {isError && <QueryErrorState title="Seri yüklenemedi" isRetrying={isFetching} onRetry={() => { void refetch() }} />}
    {data && <ul className="max-h-40 space-y-2 overflow-y-auto text-sm">
      {data.map((row) => <li key={row.id} className="flex flex-wrap justify-between gap-2">
        <span>{formatDateShort(row.reservation_date)} · {formatTime(row.start_time)}–{formatTime(row.end_time)}</span>
        <span>{RESERVATION_STATUS_LABELS[row.status]}</span>
      </li>)}
    </ul>}
    <p className="text-xs text-slate-500 dark:text-ink-400">Seri adı müşteri adıdır. İşlem seçili rezervasyona göre uygulanır.
      Başlamış, tamamlanmış ve iptal edilmiş haftalar değiştirilmez. Saat değişiminde eski kayıt geçmişte korunur.</p>
    <fieldset disabled={busy} className="space-y-3">
      <Select aria-label="Seri işlemi" value={action} onChange={(e) => setAction(e.target.value === 'update' ? 'update' : 'cancel')}
        options={[{ value: 'cancel', label: 'İptal et' }, { value: 'update', label: 'Saat değiştir' }]} />
      <Select aria-label="İşlem kapsamı" value={scope} onChange={(e) => {
        const value = e.target.value; if (value === 'one' || value === 'following' || value === 'all') setScope(value)
      }} options={[{ value: 'one', label: 'Yalnızca bu hafta' }, { value: 'following', label: 'Bu ve sonrası' },
        { value: 'all', label: 'Tüm seri (gelecek haftalar)' }]} />
      {action === 'update' && <div className="grid grid-cols-2 gap-3">
        <Input label="Yeni başlangıç" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        <Input label="Yeni bitiş" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
      </div>}
    </fieldset>
    <SeriesReview key={JSON.stringify(input)} input={input} onBusy={setBusy} onSaved={onSaved} />
  </div>
}

export function SeriesManager({ seriesId, reservationId, customerName, inline = false, onSaved }: {
  seriesId: string; reservationId: string; customerName: string; inline?: boolean; onSaved?: () => void
}) {
  const [open, setOpen] = useState(false)
  return <>
    <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
      <Repeat className="size-4" aria-hidden /> Haftalık · Seriyi Yönet
    </Button>
    {open && (inline ? <div className="w-full rounded-xl border border-slate-200 p-3 dark:border-ink-800">
      <SeriesManagerContent seriesId={seriesId} reservationId={reservationId}
        onSaved={() => { setOpen(false); onSaved?.() }} />
    </div> : <Dialog open onClose={() => setOpen(false)} title={`Haftalık seri · ${customerName}`}>
      <SeriesManagerContent seriesId={seriesId} reservationId={reservationId}
        onSaved={() => { setOpen(false); onSaved?.() }} />
    </Dialog>)}
  </>
}
