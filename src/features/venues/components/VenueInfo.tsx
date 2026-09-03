import { Check, MapPin, Navigation, Phone } from 'lucide-react'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import { Badge } from '@/components/ui/Badge'
import { RatingStars } from '@/components/ui/RatingStars'
import { FavoriteButton } from '@/features/favorites/components/FavoriteButton'
import { formatTime } from '@/lib/format'
import { venuePinIcon } from '@/lib/map'
import type { RatingSummary } from '@/features/reviews/types'
import type { VenueDetail } from '../types'

const DAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

export function VenueInfo({ venue, rating }: { venue: VenueDetail; rating: RatingSummary }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {venue.sports.map((sport) => <Badge key={sport.id}>{sport.name}</Badge>)}
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white sm:text-4xl">{venue.name}</h1>
        <FavoriteButton venueId={venue.id} variant="plain" className="shrink-0" />
      </div>
      {rating.count > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <RatingStars value={rating.average} size="md" />
          <span className="font-semibold text-slate-900 dark:text-ink-50">{rating.average.toFixed(1)}</span>
          <span className="text-sm text-slate-500 dark:text-ink-400">({rating.count} değerlendirme)</span>
        </div>
      )}
      <p className="mt-2 flex items-center gap-1.5 text-slate-500 dark:text-ink-400">
        <MapPin className="size-4 shrink-0 text-primary-600" aria-hidden />
        {venue.address ? `${venue.address}, ` : ''}{venue.district}, {venue.city}
      </p>
      {venue.phone && (
        <p className="mt-1 flex items-center gap-1.5 text-slate-500 dark:text-ink-400">
          <Phone className="size-4 shrink-0 text-primary-600" aria-hidden />
          {venue.phone}
        </p>
      )}

      {venue.description && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-slate-900 dark:text-ink-50">Tesis hakkında</h2>
          <p className="mt-2 whitespace-pre-line leading-relaxed text-slate-600 dark:text-ink-300">{venue.description}</p>
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
              <div key={day} className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-2.5 text-sm last:border-0 dark:border-ink-800 dark:bg-ink-900">
                <span className="font-medium text-slate-700 dark:text-ink-200">{DAY_NAMES[day]}</span>
                <span className="text-slate-500 dark:text-ink-400">
                  {!hour || hour.is_closed ? 'Kapalı' : `${formatTime(hour.open_time)} – ${formatTime(hour.close_time)}`}
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
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${venue.latitude},${venue.longitude}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700">
              <Navigation className="size-4" aria-hidden />
              Yol Tarifi Al
            </a>
          </div>
          <div className="mt-3 h-64 overflow-hidden rounded-2xl border border-slate-200 shadow-soft dark:border-ink-800">
            <MapContainer center={[venue.latitude, venue.longitude]} zoom={15} className="size-full" scrollWheelZoom={false}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[venue.latitude, venue.longitude]} icon={venuePinIcon} />
            </MapContainer>
          </div>
        </div>
      )}
    </>
  )
}
