import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/useToast'
import {
  useMyVenues,
  useOwnerReservations,
  useUpdateReservationStatus,
} from '@/features/dashboard/hooks/useDashboard'
import {
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_VARIANTS,
} from '@/features/reservations/types'
import { formatDateShort, formatPrice, formatTime } from '@/lib/format'
import type { ReservationStatus } from '@/types/database.types'

export function DashboardReservations() {
  const { data: venues } = useMyVenues()
  const [venueId, setVenueId] = useState('')
  const [status, setStatus] = useState('')
  const [date, setDate] = useState('')

  const { data: reservations, isLoading } = useOwnerReservations({
    venueId: venueId || undefined,
    status: (status || undefined) as ReservationStatus | undefined,
    date: date || undefined,
  })
  const updateStatus = useUpdateReservationStatus()
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Rezervasyonlar</h1>

      {/* Filtreler */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
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
          className="h-11 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-sm text-slate-900 dark:text-slate-50 transition-colors hover:border-slate-400 dark:hover:border-slate-600"
        />
      </div>

      {/* Liste */}
      <div className="mt-5 space-y-3">
        {isLoading &&
          Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-24" />)}

        {reservations && reservations.length === 0 && (
          <EmptyState
            title="Rezervasyon bulunamadı"
            description="Seçili filtrelere uyan rezervasyon yok."
          />
        )}

        {reservations?.map((reservation) => (
          <div
            key={reservation.id}
            className="flex flex-col gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-soft sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={RESERVATION_STATUS_VARIANTS[reservation.status]}>
                  {RESERVATION_STATUS_LABELS[reservation.status]}
                </Badge>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {formatPrice(reservation.total_price)}
                </span>
              </div>
              <p className="mt-1.5 font-semibold text-slate-900 dark:text-slate-50">
                {reservation.customer?.full_name || 'Müşteri'}
                {reservation.customer?.phone && (
                  <span className="ml-2 font-normal text-slate-500 dark:text-slate-400">
                    {reservation.customer.phone}
                  </span>
                )}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {reservation.venue?.name} · {reservation.court?.name} ·{' '}
                {formatDateShort(reservation.reservation_date)} ·{' '}
                {formatTime(reservation.start_time)}–{formatTime(reservation.end_time)}
              </p>
              {reservation.notes && (
                <p className="mt-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300">
                  Not: {reservation.notes}
                </p>
              )}
            </div>

            {/* Durum aksiyonları */}
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {reservation.status === 'pending' && (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleStatusChange(reservation.id, 'confirmed')}
                  >
                    <Check className="size-4" aria-hidden />
                    Onayla
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(reservation.id, 'cancelled')}
                  >
                    <X className="size-4" aria-hidden />
                    Reddet
                  </Button>
                </>
              )}
              {reservation.status === 'confirmed' && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleStatusChange(reservation.id, 'completed')}
                  >
                    Tamamlandı
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(reservation.id, 'cancelled')}
                  >
                    İptal Et
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
