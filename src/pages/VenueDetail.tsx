import { useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Container } from '@/components/layout/Container'
import { Seo } from '@/components/Seo'
import { Skeleton } from '@/components/ui/Skeleton'
import { QueryErrorState } from '@/components/ui/QueryErrorState'
import { ReservationDialog } from '@/features/reservations/components/ReservationDialog'
import { useVenueReviews } from '@/features/reviews/hooks/useReviews'
import { summarizeReviews } from '@/features/reviews/services/reviews.service'
import { VenueBookingPanel } from '@/features/venues/components/VenueBookingPanel'
import { VenueGallery } from '@/features/venues/components/VenueGallery'
import { VenueInfo } from '@/features/venues/components/VenueInfo'
import { VenueReviews } from '@/features/venues/components/VenueReviews'
import { useAvailability } from '@/features/venues/hooks/useAvailability'
import { useVenue } from '@/features/venues/hooks/useVenue'
import { nowInIstanbul, type TimeSlot } from '@/features/venues/services/slots'
import { serializeJsonLd } from '@/lib/security'
import { NotFound } from '@/pages/NotFound'

export function VenueDetail() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const { data: venue, isLoading, isError, isFetching, refetch } = useVenue(slug)
  const initialDate = useMemo(() => {
    const paramDate = searchParams.get('date')
    const today = nowInIstanbul().date
    const isValid = paramDate !== null && /^\d{4}-\d{2}-\d{2}$/.test(paramDate)
    return isValid && paramDate >= today ? paramDate : today
  }, [searchParams])
  const [date, setDate] = useState(initialDate)
  const [activeCourtId, setActiveCourtId] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const {
    data: availability,
    isLoading: slotsLoading,
    isError: slotsError,
    isFetching: slotsFetching,
    refetch: refetchSlots,
  } = useAvailability(venue, date)
  const {
    data: reviews,
    isError: reviewsError,
    isFetching: reviewsFetching,
    refetch: refetchReviews,
  } = useVenueReviews(venue?.id)

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
  if (isError && !venue) {
    return (
      <Container className="py-12">
        <QueryErrorState
          title="Tesis yüklenemedi"
          description="Tesis bilgileri alınamadı. Lütfen tekrar deneyin."
          isRetrying={isFetching}
          onRetry={() => { void refetch() }}
        />
      </Container>
    )
  }
  if (!venue) return <NotFound />

  const activeCourt = venue.courts.find((court) => court.id === activeCourtId) ?? venue.courts[0]
  const activeSlots = availability?.find((item) => item.courtId === activeCourt?.id)?.slots ?? []
  const ratingSummary = summarizeReviews(reviews ?? [])
  const seoDescription = (
    venue.description?.trim() ||
    `${venue.name} — ${venue.district}, ${venue.city}. Sporları, olanakları ve müsait saatleri gör, online rezervasyon yap.`
  ).slice(0, 160)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsActivityLocation',
    name: venue.name,
    ...(venue.description ? { description: venue.description } : {}),
    ...(venue.cover_image_url ? { image: venue.cover_image_url } : {}),
    ...(venue.phone ? { telephone: venue.phone } : {}),
    address: {
      '@type': 'PostalAddress',
      ...(venue.address ? { streetAddress: venue.address } : {}),
      addressLocality: venue.district,
      addressRegion: venue.city,
      addressCountry: 'TR',
    },
    ...(venue.latitude !== null && venue.longitude !== null
      ? { geo: { '@type': 'GeoCoordinates', latitude: venue.latitude, longitude: venue.longitude } }
      : {}),
    ...(ratingSummary.count > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: ratingSummary.average.toFixed(1),
            reviewCount: ratingSummary.count,
          },
        }
      : {}),
  }

  return (
    <>
      <Seo
        title={venue.name}
        description={seoDescription}
        image={venue.cover_image_url}
        canonicalPath={`/tesis/${venue.slug}`}
        type="article"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <VenueGallery venue={venue} />
      <section className="bg-[#fafbf8] dark:bg-ink-950">
        <Container className="py-10 sm:py-14">
          <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
            <div>
              <VenueInfo venue={venue} rating={ratingSummary} />
              <VenueReviews
                reviews={reviews ?? []}
                rating={ratingSummary}
                isError={reviewsError}
                isRetrying={reviewsFetching}
                onRetry={() => { void refetchReviews() }}
              />
            </div>
            <VenueBookingPanel
              courts={venue.courts}
              activeCourt={activeCourt}
              activeSlots={activeSlots}
              date={date}
              slotsLoading={slotsLoading}
              slotsError={slotsError}
              retrying={slotsFetching}
              onDateChange={setDate}
              onCourtChange={setActiveCourtId}
              onSlotSelect={setSelectedSlot}
              onRetry={() => { void refetchSlots() }}
            />
          </div>
        </Container>
      </section>
      {activeCourt && selectedSlot && (
        <ReservationDialog
          venue={venue}
          court={activeCourt}
          date={date}
          slot={selectedSlot}
          open
          onClose={() => setSelectedSlot(null)}
        />
      )}
    </>
  )
}
