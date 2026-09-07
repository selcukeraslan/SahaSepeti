import { OwnerReservationCard } from '@/features/dashboard/components/OwnerReservationCard'
import { useState } from 'react'
import { reservationSourceSchema } from '@/features/reservations/schemas'
import { RESERVATION_SOURCE_LABELS } from '@/features/reservations/types'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { QueryErrorState } from '@/components/ui/QueryErrorState'
import { useToast } from '@/components/ui/useToast'
import {
  useMyVenues,
  useOwnerReservations,
  useScheduleMutations,
  useUpdateReservationStatus,
} from '@/features/dashboard/hooks/useDashboard'
import {
  RESERVATION_STATUS_LABELS,
} from '@/features/reservations/types'
import type { ReservationStatus } from '@/types/database.types'

export function DashboardReservations() {
  const { data: venues } = useMyVenues()
  const [venueId, setVenueId] = useState('')
  const [status, setStatus] = useState('')
  const [date, setDate] = useState('')
  const [source, setSource] = useState('')
  const [repeating, setRepeating] = useState(false)

  const { data: reservations, isLoading, isError, isFetching, refetch } = useOwnerReservations({
    venueId: venueId || undefined,
    status: (status || undefined) as ReservationStatus | undefined,
    date: date || undefined,
    source: source ? reservationSourceSchema.parse(source) : undefined,
    repeating,
  })
  const updateStatus = useUpdateReservationStatus()
  const { setNoShow } = useScheduleMutations()
  const { toast } = useToast()

  const handleStatusChange = (reservationId: string, nextStatus: ReservationStatus) => {
    updateStatus.mutate(
      { reservationId, status: nextStatus },
      {
        onSuccess: () => toast('Rezervasyon güncellendi', 'success'),
        onError: (error) => toast(error.message, 'error'),
      },
    )
  }

  const handleNoShow = (reservationId: string, value: boolean) => {
    setNoShow.mutate(
      { reservationId, value },
      {
        onSuccess: () => toast(value ? 'No-show işaretlendi' : 'No-show kaldırıldı', 'success'),
        onError: (error) => toast(error.message, 'error'),
      },
    )
  }

  // Blok (bakım) kayıtları burada listelenmez; onlar takvimde yönetilir.
  const visible = reservations?.filter((reservation) => !reservation.is_block)

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-ink-50">Rezervasyonlar</h1>

      {/* Filtreler */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          aria-label="Kaynak filtresi"
          placeholder="Tüm kaynaklar"
          value={source}
          onChange={(event) => setSource(event.target.value)}
          options={Object.entries(RESERVATION_SOURCE_LABELS)
            .filter(([value]) => value !== 'block')
            .map(([value, label]) => ({ value, label }))}
        />
        <Select
          aria-label="Tesis filtresi"
          placeholder="Tüm tesisler"
          value={venueId}
          onChange={(event) => setVenueId(event.target.value)}
          options={(venues ?? []).map((venue) => ({ value: venue.id, label: venue.name }))}
        />
        <Select
          aria-label="Durum filtresi"
          placeholder="Tüm durumlar"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          options={Object.entries(RESERVATION_STATUS_LABELS).map(([value, label]) => ({
            value,
            label,
          }))}
        />
        <input
          type="date"
          aria-label="Tarih filtresi"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="h-11 rounded-xl border border-slate-300 dark:border-ink-700 bg-white dark:bg-ink-900 px-3.5 text-sm text-slate-900 dark:text-ink-50 transition-colors hover:border-slate-400 dark:hover:border-ink-600"
        />
      </div>

      {/* Liste */}
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={repeating} onChange={(e) => setRepeating(e.target.checked)} />
        Yalnızca tekrarlayan rezervasyonlar
      </label>
      <div className="mt-5 space-y-3">
        {isLoading &&
          Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-24" />)}

        {isError && (
          <QueryErrorState
            title="Rezervasyonlar yüklenemedi"
            isRetrying={isFetching}
            onRetry={() => { void refetch() }}
          />
        )}

        {visible && visible.length === 0 && (
          <EmptyState
            title="Rezervasyon bulunamadı"
            description="Seçili filtrelere uyan rezervasyon yok."
            action={(venueId || status || date || source || repeating) ? (
              <Button variant="outline" size="sm" onClick={() => { setVenueId(''); setStatus(''); setDate(''); setSource(''); setRepeating(false) }}>
                Filtreleri Temizle
              </Button>
            ) : undefined}
          />
        )}

        {visible?.map((reservation) => (
          <OwnerReservationCard key={reservation.id} reservation={reservation}
            updateStatus={updateStatus} setNoShow={setNoShow}
            onStatusChange={handleStatusChange} onNoShow={handleNoShow} />
        ))}
      </div>
    </div>
  )
}
