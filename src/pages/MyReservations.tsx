import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarX2, Clock, MapPin, Star } from 'lucide-react'
import { Seo } from '@/components/Seo'
import { Container } from '@/components/layout/Container'
import { PublicPageHero } from '@/components/layout/PublicPageHero'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/useToast'
import {
  useCancelReservation,
  useMyReservations,
} from '@/features/reservations/hooks/useReservations'
import {
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_VARIANTS,
  type ReservationWithVenue,
} from '@/features/reservations/types'
import { ReservationActions } from '@/features/reservations/components/ReservationActions'
import { ReviewDialog } from '@/features/reviews/components/ReviewDialog'
import { nowInIstanbul } from '@/features/venues/services/slots'
import { formatDateShort, formatPrice, formatTime } from '@/lib/format'

function isUpcoming(reservation: ReservationWithVenue, today: string): boolean {
  return (
    reservation.reservation_date >= today &&
    (reservation.status === 'pending' || reservation.status === 'confirmed')
  )
}

function ReservationCard({
  reservation,
  onCancel,
  onReview,
  showActions = false,
}: {
  reservation: ReservationWithVenue
  onCancel?: (reservation: ReservationWithVenue) => void
  onReview?: (reservation: ReservationWithVenue) => void
  /** Yaklaşan rezervasyonlarda takvim/paylaşım kısayolları */
  showActions?: boolean
}) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-soft dark:border-ink-700 dark:bg-ink-900 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={RESERVATION_STATUS_VARIANTS[reservation.status]}>
            {RESERVATION_STATUS_LABELS[reservation.status]}
          </Badge>
          <span className="text-sm font-semibold text-slate-900 dark:text-ink-50">
            {formatPrice(reservation.total_price)}
          </span>
        </div>
        {reservation.venue ? (
          <Link
            to={`/tesis/${reservation.venue.slug}`}
            className="mt-1.5 block truncate font-semibold text-slate-900 dark:text-ink-50 hover:text-primary-700"
          >
            {reservation.venue.name}
          </Link>
        ) : (
          <p className="mt-1.5 font-semibold text-slate-900 dark:text-ink-50">Tesis</p>
        )}
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-ink-400">
          {reservation.venue && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden />
              {reservation.venue.district}, {reservation.venue.city}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden />
            {formatDateShort(reservation.reservation_date)} ·{' '}
            {formatTime(reservation.start_time)}–{formatTime(reservation.end_time)}
            {reservation.court && ` · ${reservation.court.name}`}
          </span>
        </div>
        {showActions && (
          <div className="mt-2.5 -ml-2.5">
            <ReservationActions reservation={reservation} />
          </div>
        )}
      </div>
      {onCancel && (
        <Button variant="outline" size="sm" onClick={() => onCancel(reservation)}>
          İptal Et
        </Button>
      )}
      {onReview && reservation.status === 'completed' && (
        <Button variant="secondary" size="sm" onClick={() => onReview(reservation)}>
          <Star className="size-4" aria-hidden />
          Değerlendir
        </Button>
      )}
    </div>
  )
}

export function MyReservations() {
  const { data: reservations, isLoading } = useMyReservations()
  const cancelReservation = useCancelReservation()
  const { toast } = useToast()
  const [cancelTarget, setCancelTarget] = useState<ReservationWithVenue | null>(null)
  const [reviewTarget, setReviewTarget] = useState<ReservationWithVenue | null>(null)

  const today = useMemo(() => nowInIstanbul().date, [])

  const upcoming = reservations?.filter((item) => isUpcoming(item, today)) ?? []
  const past = reservations?.filter((item) => !isUpcoming(item, today)) ?? []

  const handleCancel = () => {
    if (!cancelTarget) return
    cancelReservation.mutate(
      { reservationId: cancelTarget.id },
      {
        onSuccess: () => {
          setCancelTarget(null)
          toast('Rezervasyonunuz iptal edildi', 'success')
        },
        onError: (error) => toast(error.message, 'error'),
      },
    )
  }

  return (
    <>
      <Seo title="Rezervasyonlarım" canonicalPath="/rezervasyonlarim" />
      <PublicPageHero
        eyebrow="Oyun takvimin"
        title="Rezervasyonların"
        description="Yaklaşan maçlarını takip et, takvimine ekle veya geçmiş oyunlarını değerlendir."
        aside={reservations ? <p className="text-sm font-semibold text-slate-500 dark:text-ink-400">{upcoming.length} yaklaşan rezervasyon</p> : undefined}
      />
      <section className="bg-[#fafbf8] py-10 dark:bg-ink-950 sm:py-14">
        <Container>

      {isLoading && (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
      )}

      {reservations && reservations.length === 0 && (
        <div className="mt-6">
          <EmptyState
            icon={CalendarX2}
            title="Henüz rezervasyonunuz yok"
            description="Yakınınızdaki sahaları keşfedin ve ilk rezervasyonunuzu yapın."
            action={
              <Link to="/tesisler">
                <Button>Saha Bul</Button>
              </Link>
            }
          />
        </div>
      )}

      {upcoming.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-ink-50">Yaklaşan</h2>
          <div className="mt-3 space-y-3">
            {upcoming.map((reservation) => (
              <ReservationCard
                key={reservation.id}
                reservation={reservation}
                onCancel={setCancelTarget}
                showActions
              />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-ink-50">Geçmiş</h2>
          <div className="mt-3 space-y-3">
            {past.map((reservation) => (
              <ReservationCard
                key={reservation.id}
                reservation={reservation}
                onReview={setReviewTarget}
              />
            ))}
          </div>
        </section>
      )}

        </Container>
      </section>

      {/* İptal onayı */}
      <Dialog
        open={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        title="Rezervasyonu İptal Et"
      >
        <p className="text-sm text-slate-600 dark:text-ink-300">
          {cancelTarget?.venue?.name} tesisindeki{' '}
          {cancelTarget && formatDateShort(cancelTarget.reservation_date)}{' '}
          {cancelTarget && formatTime(cancelTarget.start_time)} rezervasyonunuzu iptal etmek
          istediğinize emin misiniz?
        </p>
        <div className="mt-5 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setCancelTarget(null)}>
            Vazgeç
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            isLoading={cancelReservation.isPending}
            onClick={handleCancel}
          >
            İptal Et
          </Button>
        </div>
      </Dialog>

      {/* Değerlendirme */}
      {reviewTarget && (
        <ReviewDialog
          open={reviewTarget !== null}
          onClose={() => setReviewTarget(null)}
          venueId={reviewTarget.venue_id}
          venueName={reviewTarget.venue?.name ?? 'Tesis'}
          reservationId={reviewTarget.id}
        />
      )}
    </>
  )
}
