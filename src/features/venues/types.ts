import type { Court, OpeningHour, PriceRule, Sport, Venue, VenueImage } from '@/types/database.types'

/** Liste sıralama seçenekleri; undefined = önerilen (en yeni önce). */
export type VenueSort = 'rating' | 'price-asc' | 'price-desc'

export const VENUE_SORT_OPTIONS: { value: VenueSort; label: string }[] = [
  { value: 'rating', label: 'En Yüksek Puan' },
  { value: 'price-asc', label: 'Fiyat (Önce Düşük)' },
  { value: 'price-desc', label: 'Fiyat (Önce Yüksek)' },
]

export function isVenueSort(value: string | null): value is VenueSort {
  return value === 'rating' || value === 'price-asc' || value === 'price-desc'
}

/** Tesis listeleme filtreleri — URL query paramlarıyla senkron tutulur. */
export interface VenueFilters {
  city?: string
  district?: string
  /** sports.slug */
  sport?: string
  /** yyyy-MM-dd — detay sayfasına taşınır, listede ön seçim olarak kullanılır */
  date?: string
  /** İsim içinde arama */
  q?: string
  sort?: VenueSort
}

/** Liste kartında gösterilen tesis + spor rozetleri + başlangıç fiyatı + puan özeti */
export interface VenueListItem extends Venue {
  sports: Sport[]
  minPrice: number | null
  /** Ortalama puan (yorum yoksa null) */
  avgRating: number | null
  /** Toplam yorum sayısı */
  reviewCount: number
}

/** Detay sayfası için tüm ilişkili veriler */
export interface VenueDetail extends Venue {
  sports: Sport[]
  images: VenueImage[]
  courts: CourtWithPrices[]
  openingHours: OpeningHour[]
}

export interface CourtWithPrices extends Court {
  priceRules: PriceRule[]
  sport: Sport | null
}
