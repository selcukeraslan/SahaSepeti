import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { venuePinIcon, userDotIcon } from '@/lib/map'
import { TURKEY_CENTER, TURKEY_ZOOM, type GeoPoint } from '@/lib/geo'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { VenueListItem } from '../types'

interface VenueMapProps {
  venues: VenueListItem[]
  userLocation?: GeoPoint | null
  className?: string
}

interface MappableVenue extends VenueListItem {
  latitude: number
  longitude: number
}

function hasCoords(venue: VenueListItem): venue is MappableVenue {
  return venue.latitude !== null && venue.longitude !== null
}

/** Marker kümesi değişince haritayı otomatik sığdırır. */
function FitBounds({ points }: { points: GeoPoint[] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    if (points.length === 1) {
      const point = points[0]
      if (point) map.setView([point.lat, point.lng], 14)
      return
    }
    map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: [40, 40] })
  }, [map, points])
  return null
}

/** Tesisleri harita üzerinde gösterir; popup'tan detaya gidilir. */
export function VenueMap({ venues, userLocation, className }: VenueMapProps) {
  const mappable = useMemo(() => venues.filter(hasCoords), [venues])
  const fitPoints = useMemo<GeoPoint[]>(() => {
    const points: GeoPoint[] = mappable.map((v) => ({ lat: v.latitude, lng: v.longitude }))
    if (userLocation) points.push(userLocation)
    return points
  }, [mappable, userLocation])

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-slate-200 shadow-soft dark:border-ink-800', className)}>
      <MapContainer
        center={[TURKEY_CENTER.lat, TURKEY_CENTER.lng]}
        zoom={TURKEY_ZOOM}
        className="size-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={fitPoints} />

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userDotIcon} />
        )}

        {mappable.map((venue) => (
          <Marker
            key={venue.id}
            position={[venue.latitude, venue.longitude]}
            icon={venuePinIcon}
          >
            <Popup>
              <div className="min-w-44">
                <p className="font-semibold text-slate-900 dark:text-ink-50">{venue.name}</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-ink-400">
                  {venue.district}, {venue.city}
                </p>
                {venue.minPrice !== null && (
                  <p className="mt-1 text-sm font-semibold text-primary-600">
                    {formatPrice(venue.minPrice)}
                    <span className="font-normal text-slate-400 dark:text-ink-500"> / saat'ten</span>
                  </p>
                )}
                <Link
                  to={`/tesis/${venue.slug}`}
                  className="mt-2 inline-block rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
                >
                  Müsait Saatleri Gör
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
