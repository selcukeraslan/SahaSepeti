import { useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Check, ImageOff, MapPin, Navigation, Phone } from 'lucide-react'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import { venuePinIcon } from '@/lib/map'
import { Container } from '@/components/layout/Container'
import { Badge } from '@/components/ui/Badge'
import { RatingStars } from '@/components/ui/RatingStars'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { DateStrip } from '@/features/venues/components/DateStrip'
import { SlotGrid } from '@/features/venues/components/SlotGrid'
import { useVenue } from '@/features/venues/hooks/useVenue'
import { useAvailability } from '@/features/venues/hooks/useAvailability'
import { nowInIstanbul, type TimeSlot } from '@/features/venues/services/slots'
import { ReservationDialog } from '@/features/reservations/components/ReservationDialog'
import { FavoriteButton } from '@/features/favorites/components/FavoriteButton'
import { ReviewList } from '@/features/reviews/components/ReviewList'
import { useVenueReviews } from '@/features/reviews/hooks/useReviews'
import { summarizeReviews } from '@/features/reviews/services/reviews.service'
import { formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { NotFound } from '@/pages/NotFound'

const DAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
/** Haftayı Pazartesi'den başlatarak göster */
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

export function VenueDetail() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const { data: venue, isLoading } = useVenue(slug)

  const initialDate = useMemo(() => {
    const paramDate = searchParams.get('date')
    const today = nowInIstanbul().date
    const isValid = paramDate !== null && /^\d{4}-\d{2}-\d{2}$/.test(paramDate)
    return isValid && paramDate >= today ? paramDate : today
  }, [searchParams])

  const [date, setDate] = useState(initialDate)
  const [activeCourtId, setActiveCourtId] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)

  const { data: availability, isLoading: slotsLoading } = useAvailability(venue, date)
  const { data: reviews } = useVenueReviews(venue?.id)

  if (isLoading) {
    return (
      <Container className="py-8">
        <Skeleton className="aspect-[3/1] w-full" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </Container>
    )
  }

  if (!venue) {
    return <NotFound />
  }

  const activeCourt = venue.courts.find((court) => court.id === activeCourtId) ?? venue.courts[0]
  const activeSlots =
    availability?.find((item) => item.courtId === activeCourt?.id)?.slots ?? []
  const ratingSummary = summarizeReviews(reviews ?? [])

  return (
    <>
      {/* Galeri */}
      <section className="bg-ink-900">
        <Container className="py-0">
          <div className="grid gap-1 sm:grid-cols-3">
            <div className="relative aspect-[3/2] overflow-hidden sm:col-span-2 sm:aspect-auto">
              {venue.cover_image_url ? (
                <img
                  src={venue.cover_image_url}
                  alt={venue.name}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full min-h-64 items-center justify-center bg-ink-800">
                  <ImageOff className="size-10 text-slate-600" aria-hidden />
                </div>
              )}
            </div>
            <div className="hidden grid-rows-2 gap-1 sm:grid">
              {[0, 1].map((index) => {
                const image = venue.images[index]
                return image ? (
                  <img
                    key={image.id}
                    src={image.url}
                    alt={`${venue.name} görsel ${index + 2}`}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                ) : (
                  <div key={index} className="flex items-center justify-center bg-ink-800">
                    <ImageOff className="size-6 text-slate-600" aria-hidden />
                  </div>
                )
              })}
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          {/* Sol: tesis bilgileri */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {venue.sports.map((sport) => (
                <Badge key={sport.id}>{sport.name}</Badge>
              ))}
            </div>
            <div className="mt-3 flex items-start justify-between gap-3">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-ink-50">{venue.name}</h1>
              <FavoriteButton venueId={venue.id} variant="plain" className="shrink-0" />
            </div>
            {ratingSummary.count > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <RatingStars value={ratingSummary.average} size="md" />
                <span className="font-semibold text-slate-900 dark:text-ink-50">
                  {ratingSummary.average.toFixed(1)}
                </span>
                <span className="text-sm text-slate-500 dark:text-ink-400">
                  ({ratingSummary.count} değerlendirme)
                </span>
              </div>
            )}
            <p className="mt-2 flex items-center gap-1.5 text-slate-500 dark:text-ink-400">
              <MapPin className="size-4 shrink-0 text-primary-600" aria-hidden />
              {venue.address ? `${venue.address}, ` : ''}
              {venue.district}, {venue.city}
            </p>
            {venue.phone && (
              <p className="mt-1 flex items-center gap-1.5 text-slate-500 dark:text-ink-400">
                <Phone className="size-4 shrink-0 text-primary-600" aria-hidden />
                {venue.phone}
              </p>
            )}

            {venue.description && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-ink-50">Tesis Hakkında</h2>
                <p className="mt-2 whitespace-pre-line leading-relaxed text-slate-600 dark:text-ink-300">
                  {venue.description}
                </p>
              </div>
            )}

            {venue.amenities.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-ink-50">Olanaklar</h2>
                <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {venue.amenities.map((amenity) => (
                    <li key={amenity} className="flex items-center gap-2 text-sm text-slate-600 dark:text-ink-300">
                      <span className="flex size-5 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-500/10">
                        <Check className="size-3 text-primary-600" aria-hidden />
                      </span>
                      {amenity}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-ink-50">Çalışma Saatleri</h2>
              <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 dark:border-ink-800">
                {DAY_ORDER.map((day) => {
                  const hour = venue.openingHours.find((item) => item.day_of_week === day)
                  return (
                    <div
                      key={day}
                      className="flex items-center justify-between border-b border-slate-100 dark:border-ink-800 bg-white dark:bg-ink-900 px-4 py-2.5 text-sm last:border-0"
                    >
                      <span className="font-medium text-slate-700 dark:text-ink-200">{DAY_NAMES[day]}</span>
                      <span className="text-slate-500 dark:text-ink-400">
                        {!hour || hour.is_closed
                          ? 'Kapalı'
                          : `${formatTime(hour.open_time)} – ${formatTime(hour.close_time)}`}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {venue.latitude !== null && venue.longitude !== null && (
              <div className="mt-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-ink-50">Konum</h2>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${venue.latitude},${venue.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    <Navigation className="size-4" aria-hidden />
                    Yol Tarifi Al
                  </a>
                </div>
                <div className="mt-3 h-64 overflow-hidden rounded-2xl border border-slate-200 shadow-soft dark:border-ink-800">
                  <MapContainer
                    center={[venue.latitude, venue.longitude]}
                    zoom={15}
                    className="size-full"
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[venue.latitude, venue.longitude]} icon={venuePinIcon} />
                  </MapContainer>
                </div>
              </div>
            )}

            <div className="mt-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-ink-50">
                Değerlendirmeler
                {ratingSummary.count > 0 && (
                  <span className="ml-1.5 text-base font-normal text-slate-400 dark:text-ink-500">
                    ({ratingSummary.count})
                  </span>
                )}
              </h2>
              {reviews && reviews.length > 0 ? (
                <ReviewList reviews={reviews} />
              ) : (
                <p className="mt-2 text-sm text-slate-500 dark:text-ink-400">
                  Bu tesis için henüz değerlendirme yapılmamış.
                </p>
              )}
            </div>
          </div>

          {/* Sağ: rezervasyon paneli */}
          <div>
            <div className="sticky top-24 rounded-3xl border border-slate-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-5 shadow-soft">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-ink-50">Müsait Saatler</h2>
              <div className="mt-4">
                <DateStrip selected={date} onSelect={setDate} />
              </div>

              {venue.courts.length === 0 ? (
                <div className="mt-4">
                  <EmptyState
                    title="Henüz saha eklenmemiş"
                    description="Bu tesis henüz rezervasyona açık saha tanımlamamış."
                  />
                </div>
              ) : (
                <>
                  {/* Saha sekmeleri */}
                  <div
                    className="mt-4 flex gap-2 overflow-x-auto pb-1"
                    role="tablist"
                    aria-label="Saha seçimi"
                  >
                    {venue.courts.map((court) => {
                      const isActive = court.id === activeCourt?.id
                      return (
                        <button
                          key={court.id}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          onClick={() => setActiveCourtId(court.id)}
                          className={cn(
                            'shrink-0 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors',
                            isActive
                              ? 'border-primary-600 bg-primary-600 text-white'
                              : 'border-slate-200 dark:border-ink-800 bg-white dark:bg-ink-900 text-slate-600 dark:text-ink-300 hover:border-primary-300',
                          )}
                        >
                          {court.name}
                          {court.is_indoor && (
                            <span
                              className={cn(
                                'ml-1.5 text-xs',
                                isActive ? 'text-primary-100' : 'text-slate-400 dark:text-ink-500',
                              )}
                            >
                              (Kapalı)
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  <div className="mt-4">
                    {slotsLoading ? (
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                        {Array.from({ length: 10 }, (_, index) => (
                          <Skeleton key={index} className="h-14" />
                        ))}
                      </div>
                    ) : (
                      <SlotGrid slots={activeSlots} onSelect={setSelectedSlot} />
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Container>

      {/* Rezervasyon dialogu */}
      {activeCourt && selectedSlot && (
        <ReservationDialog
          venue={venue}
          court={activeCourt}
          date={date}
          slot={selectedSlot}
          open={selectedSlot !== null}
          onClose={() => setSelectedSlot(null)}
        />
      )}
    </>
  )
}
