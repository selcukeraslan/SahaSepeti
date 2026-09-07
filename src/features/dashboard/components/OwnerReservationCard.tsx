import { Check, X } from 'lucide-react'
import { SeriesManager } from './SeriesManager'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ReservationSourceBadge } from '@/features/reservations/components/ReservationSourceBadge'
import { RESERVATION_STATUS_LABELS, RESERVATION_STATUS_VARIANTS } from '@/features/reservations/types'
import { formatDateShort, formatPrice, formatTime } from '@/lib/format'
import { nowInIstanbul } from '@/features/venues/services/slots'
import type { ReservationStatus } from '@/types/database.types'
import type { OwnerReservation } from '../services/ownerReservations.service'
import { getReservationActionAvailability } from '../services/reservationActions'
import type { useScheduleMutations, useUpdateReservationStatus } from '../hooks/useDashboard'

interface OwnerReservationCardProps {
  reservation: OwnerReservation
  updateStatus: ReturnType<typeof useUpdateReservationStatus>
  setNoShow: ReturnType<typeof useScheduleMutations>['setNoShow']
  onStatusChange: (reservationId: string, status: ReservationStatus) => void
  onNoShow: (reservationId: string, value: boolean) => void
}

export function OwnerReservationCard({
  reservation, updateStatus, setNoShow, onStatusChange, onNoShow,
}: OwnerReservationCardProps) {
  const actions = getReservationActionAvailability(reservation, nowInIstanbul())
  const mutationsPending = updateStatus.isPending || setNoShow.isPending
  return (
          <div
            className="flex flex-col gap-3 rounded-2xl border border-slate-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4 shadow-soft sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={RESERVATION_STATUS_VARIANTS[reservation.status]}>
                  {RESERVATION_STATUS_LABELS[reservation.status]}
                </Badge>
                <ReservationSourceBadge source={reservation.source} />
                <span className="text-sm font-semibold text-slate-900 dark:text-ink-50">
                  {formatPrice(reservation.total_price)}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-semibold text-slate-900 dark:text-ink-50">
                  {reservation.customer?.full_name || reservation.guest_name || 'Müşteri'}
                </span>
                {(reservation.customer?.phone || reservation.guest_phone) && (
                  <span className="font-normal text-slate-500 dark:text-ink-400">
                    {reservation.customer?.phone || reservation.guest_phone}
                  </span>
                )}
                {reservation.no_show && <Badge variant="danger">Gelmedi</Badge>}
              </div>
              <p className="text-sm text-slate-500 dark:text-ink-400">
                {reservation.venue?.name} · {reservation.court?.name} ·{' '}
                {formatDateShort(reservation.reservation_date)} ·{' '}
                {formatTime(reservation.start_time)}–{formatTime(reservation.end_time)}
              </p>
              {reservation.notes && (
                <p className="mt-1.5 rounded-lg bg-slate-50 dark:bg-ink-950 px-3 py-1.5 text-sm text-slate-600 dark:text-ink-300">
                  Not: {reservation.notes}
                </p>
              )}
            </div>

            {/* Durum aksiyonları */}
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {reservation.series_id && <SeriesManager seriesId={reservation.series_id}
                reservationId={reservation.id} customerName={reservation.guest_name ?? 'Müşteri'} />}
              {reservation.status === 'pending' && (
                <>
                  <Button
                    size="sm"
                    isLoading={updateStatus.isPending && updateStatus.variables?.reservationId === reservation.id && updateStatus.variables.status === 'confirmed'}
                    disabled={updateStatus.isPending || setNoShow.isPending}
                    onClick={() => onStatusChange(reservation.id, 'confirmed')}
                  >
                    <Check className="size-4" aria-hidden />
                    Onayla
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    isLoading={updateStatus.isPending && updateStatus.variables?.reservationId === reservation.id && updateStatus.variables.status === 'cancelled'}
                    disabled={updateStatus.isPending || setNoShow.isPending}
                    onClick={() => onStatusChange(reservation.id, 'cancelled')}
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
                    isLoading={updateStatus.isPending && updateStatus.variables?.reservationId === reservation.id && updateStatus.variables.status === 'completed'}
                    disabled={mutationsPending || !actions.canComplete}
                    title={!actions.canComplete ? 'Rezervasyon bitiş saatinden sonra tamamlanabilir' : undefined}
                    onClick={() => onStatusChange(reservation.id, 'completed')}
                  >
                    Tamamlandı
                  </Button>
                  <Button
                    variant={reservation.no_show ? 'outline' : 'ghost'}
                    size="sm"
                    isLoading={setNoShow.isPending && setNoShow.variables?.reservationId === reservation.id}
                    disabled={mutationsPending || !actions.canMarkNoShow}
                    title={!actions.canMarkNoShow ? 'No-show rezervasyon başladıktan sonra işaretlenebilir' : undefined}
                    onClick={() => onNoShow(reservation.id, !reservation.no_show)}
                  >
                    {reservation.no_show ? "No-show'u kaldır" : 'Gelmedi'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    isLoading={updateStatus.isPending && updateStatus.variables?.reservationId === reservation.id && updateStatus.variables.status === 'cancelled'}
                    disabled={mutationsPending || !actions.canCancel}
                    title={!actions.canCancel ? 'Başlamış rezervasyon iptal edilemez' : undefined}
                    onClick={() => onStatusChange(reservation.id, 'cancelled')}
                  >
                    İptal Et
                  </Button>
                </>
              )}
            </div>
          </div>
  )
}
