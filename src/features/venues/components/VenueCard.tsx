import { Link } from 'react-router-dom'
import { MapPin, ImageOff } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { formatPrice } from '@/lib/format'
import type { VenueListItem } from '../types'

export function VenueCard({ venue }: { venue: VenueListItem }) {
  return (
    <Link
      to={`/tesis/${venue.slug}`}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft transition-shadow hover:shadow-soft-lg"
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-slate-100">
        {venue.cover_image_url ? (
          <img
            src={venue.cover_image_url}
            alt={venue.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageOff className="size-8 text-slate-300" aria-hidden />
          </div>
        )}
        {venue.minPrice !== null && (
          <span className="absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-1 text-sm font-semibold text-slate-900 shadow-soft">
            {formatPrice(venue.minPrice)}
            <span className="font-normal text-slate-500"> / saat'ten</span>
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 group-hover:text-primary-700">{venue.name}</h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          {venue.district}, {venue.city}
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
