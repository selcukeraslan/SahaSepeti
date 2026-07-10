import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Building2, CalendarCheck2, CalendarClock, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useMyVenues, useOwnerReservations } from '@/features/dashboard/hooks/useDashboard'
import {
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_VARIANTS,
} from '@/features/reservations/types'
import { nowInIstanbul } from '@/features/venues/services/slots'
import { formatDateShort, formatPrice, formatTime } from '@/lib/format'

export function DashboardHome() {
  const { data: venues, isLoading: venuesLoading } = useMyVenues()
  const { data: reservations, isLoading: reservationsLoading } = useOwnerReservations({})

  const today = useMemo(() => nowInIstanbul().date, [])
  const todayCount =
    reservations?.filter(
      (item) => item.reservation_date === today && item.status !== 'cancelled',
    ).length ?? 0
  const pendingCount = reservations?.filter((item) => item.status === 'pending').length ?? 0

  const stats = [
    { icon: Building2, label: 'Tesis', value: venues?.length ?? 0 },
    { icon: CalendarCheck2, label: 'Bugünkü Rezervasyon', value: todayCount },
    { icon: CalendarClock, label: 'Onay Bekleyen', value: pendingCount },
  ]

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-ink-50">Genel Bakış</h1>
        <Link to="/panel/tesisler/yeni">
          <Button size="sm">
            <Plus className="size-4" aria-hidden />
            Yeni Tesis
          </Button>
        </Link>
      </div>

      {/* Özet kartları */}
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {venuesLoading || reservationsLoading
          ? Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-24" />)
          : stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="flex items-center gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-500/10 text-primary-600">
                    <stat.icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-2xl font-bold leading-none text-slate-900 dark:text-ink-50">{stat.value}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-ink-400">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Son rezervasyonlar */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-ink-50">Son Rezervasyonlar</h2>
          <Link
            to="/panel/rezervasyonlar"
            className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:hover:text-primary-300"
          >
            Tümünü gör
          </Link>
        </div>
        <div className="mt-3 space-y-2">
          {reservationsLoading &&
            Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-16" />)}
          {reservations && reservations.length === 0 && (
            <EmptyState
              title="Henüz rezervasyon yok"
              description="Tesisiniz yayına alındığında rezervasyonlar burada görünecek."
            />
          )}
          {reservations?.slice(0, 5).map((reservation) => (
            <div
              key={reservation.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-ink-800 bg-white dark:bg-ink-900 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-ink-50">
                  {reservation.customer?.full_name || 'Müşteri'} — {reservation.court?.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-ink-400">
                  {formatDateShort(reservation.reservation_date)} ·{' '}
                  {formatTime(reservation.start_time)} · {formatPrice(reservation.total_price)}
                </p>
              </div>
              <Badge variant={RESERVATION_STATUS_VARIANTS[reservation.status]}>
                {RESERVATION_STATUS_LABELS[reservation.status]}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
