/** Coğrafi yardımcılar — saf fonksiyonlar (test edilebilir). */

export interface GeoPoint {
  lat: number
  lng: number
}

/** Türkiye'yi kapsayan varsayılan harita merkezi/zoom'u. */
export const TURKEY_CENTER: GeoPoint = { lat: 39.0, lng: 35.2 }
export const TURKEY_ZOOM = 6

const EARTH_RADIUS_KM = 6371

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/** İki nokta arası büyük daire mesafesi (km, haversine). */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** "0.85" → "850 m", "2.43" → "2,4 km" (tr-TR ondalık virgül). */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} km`
}

/** Konumu olan kayıt için mesafe (km); koordinat yoksa null. */
export function distanceToOrNull(
  target: { latitude: number | null; longitude: number | null },
  from: GeoPoint,
): number | null {
  if (target.latitude === null || target.longitude === null) return null
  return haversineKm(from, { lat: target.latitude, lng: target.longitude })
}
