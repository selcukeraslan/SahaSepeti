import type { Court, OpeningHour, PriceRule, Sport, Venue, VenueImage } from '@/types/database.types'

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
}

/** Liste kartında gösterilen tesis + spor rozetleri + başlangıç fiyatı */
export interface VenueListItem extends Venue {
  sports: Sport[]
  minPrice: number | null
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
