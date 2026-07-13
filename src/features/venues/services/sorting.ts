import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { VenueListItem, VenueSort } from '../types'

/**
 * Tesis listesi sıralama + rozet kuralları — saf fonksiyonlar (test edilebilir).
 * Puan/fiyat istemcide mapVenueListRow ile hesaplandığından sıralama da istemcidedir.
 */

/** Verilen ölçüte göre YENİ dizi döner; ölçüt yoksa girdiyi aynen bırakır.
 * Değeri olmayanlar (puanı/fiyatı yok) her zaman sona gider. */
export function sortVenues(venues: VenueListItem[], sort: VenueSort | undefined): VenueListItem[] {
  if (!sort) return venues

  const compareNullsLast = (a: number | null, b: number | null, desc: boolean): number => {
    if (a === null && b === null) return 0
    if (a === null) return 1
    if (b === null) return -1
    return desc ? b - a : a - b
  }

  const sorted = [...venues]
  switch (sort) {
    case 'rating':
      sorted.sort(
        (a, b) =>
          compareNullsLast(a.avgRating, b.avgRating, true) || b.reviewCount - a.reviewCount,
      )
      break
    case 'price-asc':
      sorted.sort((a, b) => compareNullsLast(a.minPrice, b.minPrice, false))
      break
    case 'price-desc':
      sorted.sort((a, b) => compareNullsLast(a.minPrice, b.minPrice, true))
      break
  }
  return sorted
}

/** "Yüksek Puanlı" rozeti eşiği: en az bu ortalama ve bu sayıda yorum. */
export const TOP_RATED_MIN_AVERAGE = 4.5
export const TOP_RATED_MIN_REVIEWS = 3

export function isTopRated(venue: Pick<VenueListItem, 'avgRating' | 'reviewCount'>): boolean {
  return (
    venue.avgRating !== null &&
    venue.avgRating >= TOP_RATED_MIN_AVERAGE &&
    venue.reviewCount >= TOP_RATED_MIN_REVIEWS
  )
}

/** "Yeni" rozeti: son N gün içinde eklenen tesis. */
export const NEW_VENUE_DAYS = 30

/** UTC timestamp'i İstanbul takvim gününe (yyyy-MM-dd) çevirir — en-CA locale ISO biçim verir. */
const ISTANBUL_DAY_FORMAT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Istanbul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function isNewVenue(createdAt: string, todayYmd: string): boolean {
  // created_at (UTC) tarayıcı saat diliminde DEĞİL, İstanbul gününde değerlendirilir;
  // aksi halde yurtdışından bakan kullanıcıda rozet ±1 gün kayar.
  const createdYmd = ISTANBUL_DAY_FORMAT.format(new Date(createdAt))
  const days = differenceInCalendarDays(parseISO(todayYmd), parseISO(createdYmd))
  return days >= 0 && days <= NEW_VENUE_DAYS
}
