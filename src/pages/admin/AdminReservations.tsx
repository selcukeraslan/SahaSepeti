import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAdminReservations } from '@/features/admin/hooks/useAdmin'
import {
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_VARIANTS,
} from '@/features/reservations/types'
import { formatDateShort, formatPrice, formatTime } from '@/lib/format'
import type { ReservationStatus } from '@/types/database.types'

export function AdminReservations() {
  const [status, setStatus] = useState('')
  const [date, setDate] = useState('')

  const { data: reservations, isLoading } = useAdminReservations({
    status: (status || undefined) as ReservationStatus | undefined,
    date: date || undefined,
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Rezervasyonlar</h1>
      <p className="mt-1 text-sm text-slate-500">Platformdaki tüm rezervasyonlar (salt okunur).</p>

      <div className="mt-4 grid max-w-lg gap-3 sm:grid-cols-2">
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
          className="h-11 rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900"
        />
      </div>

      <div className="mt-5 space-y-2">
        {isLoading &&
          Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-16" />)}

        {reservations && reservations.length === 0 && (
          <EmptyState title="Rezervasyon bulunamadı" />
        )}

        {reservations?.map((reservation) => (
          <div
            key={reservation.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">
                {reservation.customer?.full_name || 'Müşteri'} — {reservation.venue?.name} ·{' '}
                {reservation.court?.name}
              </p>
              <p className="text-xs text-slate-500">
                {formatDateShort(reservation.reservation_date)} ·{' '}
                {formatTime(reservation.start_time)}–{formatTime(reservation.end_time)} ·{' '}
                {formatPrice(reservation.total_price)}
              </p>
            </div>
            <Badge variant={RESERVATION_STATUS_VARIANTS[reservation.status]}>
              {RESERVATION_STATUS_LABELS[reservation.status]}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  )
}
