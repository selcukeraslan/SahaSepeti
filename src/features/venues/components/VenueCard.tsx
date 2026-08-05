import { Link } from 'react-router-dom'
import { MapPin, ImageOff, Star } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { RatingStars } from '@/components/ui/RatingStars'
import { FavoriteButton } from '@/features/favorites/components/FavoriteButton'
import { formatDistance } from '@/lib/geo'
import { formatPrice } from '@/lib/format'
import { nowInIstanbul } from '../services/slots'
import { isNewVenue, isTopRated } from '../services/sorting'
import type { VenueListItem } from '../types'

export function VenueCard({
  venue,
  distanceKm,
  selectedDate,
}: {
  venue: VenueListItem
  /** Kullanıcı konumuna uzaklık (km); "Yakınımdakiler" aktifken gösterilir */
  distanceKm?: number | null
  /** Liste filtresinden detay sayfasına taşınan yyyy-MM-dd tarihi. */
  selectedDate?: string
}) {
  const today = nowInIstanbul().date
  const detailUrl = selectedDate
    ? `/tesis/${venue.slug}?date=${encodeURIComponent(selectedDate)}`
    : `/tesis/${venue.slug}`
  return (
    <Link
      to={detailUrl}
      className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-[0_24px_60px_-34px_rgba(15,23,42,0.45)] dark:border-ink-700 dark:bg-ink-900 dark:hover:border-primary-700"
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-slate-100 dark:bg-ink-800">
        {venue.cover_image_url ? (
          <img
            src={venue.cover_image_url}
            alt={venue.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageOff className="size-8 text-slate-300 dark:text-ink-600" aria-hidden />
          </div>
        )}
        <FavoriteButton venueId={venue.id} className="absolute right-3 top-3" />
        {/* Rozetler */}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {isTopRated(venue) && (
            <span className="flex items-center gap-1 rounded-full bg-amber-400/95 px-2.5 py-1 text-xs font-bold text-amber-950 shadow-soft">
              <Star className="size-3 fill-current" aria-hidden />
              Yüksek Puanlı
            </span>
          )}
          {isNewVenue(venue.created_at, today) && (
            <span className="rounded-full bg-primary-600/95 px-2.5 py-1 text-xs font-bold text-white shadow-soft">
              Yeni
            </span>
          )}
        </div>
        {venue.minPrice !== null && (
          <span className="absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-1.5 text-sm font-semibold text-slate-900 shadow-soft backdrop-blur dark:bg-ink-900/95 dark:text-ink-50">
            {formatPrice(venue.minPrice)}
            <span className="font-normal text-slate-500 dark:text-ink-400"> / saat'ten</span>
          </span>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-lg font-semibold tracking-[-0.02em] text-slate-900 transition-colors group-hover:text-primary-700 dark:text-ink-50 dark:group-hover:text-primary-300">{venue.name}</h3>
        {venue.reviewCount > 0 && venue.avgRating !== null && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <RatingStars value={venue.avgRating} />
            <span className="text-sm font-medium text-slate-700 dark:text-ink-200">
              {venue.avgRating.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 dark:text-ink-500">({venue.reviewCount})</span>
          </div>
        )}
        <p className="mt-1 flex items-center gap-1 text-sm text-slate-500 dark:text-ink-400">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          {venue.district}, {venue.city}
          {distanceKm !== null && distanceKm !== undefined && (
            <span className="ml-auto shrink-0 font-semibold text-primary-600">
              {formatDistance(distanceKm)}
            </span>
          )}
        </p>
        {venue.sports.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {venue.sports.map((sport) => (
              <Badge key={sport.id}>{sport.name}</Badge>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
