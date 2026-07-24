import { supabase } from '@/lib/supabase'
import type { Court, OpeningHour, PriceRule, Sport, Venue, VenueImage } from '@/types/database.types'
import type { VenueDetail, VenueFilters, VenueListItem } from '../types'
import { minutesToTime, nowInIstanbul, timeToMinutes } from './slots'

export async function listSports(): Promise<Sport[]> {
  const { data, error } = await supabase.from('sports').select('*').order('name')
  if (error) {
    throw new Error('Spor türleri yüklenemedi')
  }
  return data
}

export interface VenueListRow extends Venue {
  venue_sports: { sports: Sport | null }[]
  courts: { is_indoor: boolean; is_active: boolean; price_rules: Pick<PriceRule, 'price'>[] }[]
  reviews: { rating: number }[]
}

/** Liste satırlarında ortak kullanılan saha embed'i (venues + favorites). */
export const VENUE_LIST_COURTS = 'courts(is_indoor, is_active, price_rules(price))'

/** Ham liste satırını karta uygun VenueListItem'a dönüştürür (favoriler de kullanır). */
export function mapVenueListRow(row: VenueListRow): VenueListItem {
  const { venue_sports, courts, reviews, ...venue } = row
  const prices = courts.flatMap((court) => court.price_rules.map((rule) => rule.price))
  const ratings = reviews.map((review) => review.rating)
  const activeCourts = courts.filter((court) => court.is_active)
  return {
    ...venue,
    sports: venue_sports.map((vs) => vs.sports).filter((sport): sport is Sport => sport !== null),
    minPrice: prices.length > 0 ? Math.min(...prices) : null,
    avgRating: ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : null,
    reviewCount: ratings.length,
    hasIndoor: activeCourts.some((court) => court.is_indoor),
    hasOutdoor: activeCourts.some((court) => !court.is_indoor),
  }
}

export async function listVenues(filters: VenueFilters): Promise<VenueListItem[]> {
  // !inner yalnızca spor filtresi varken kullanılır; aksi halde
  // spor ataması olmayan tesisler de listede kalır.
  const sportJoin = filters.sport ? 'venue_sports!inner(sports!inner(*))' : 'venue_sports(sports(*))'

  let query = supabase
    .from('venues')
    .select(
      `*,
       ${sportJoin},
       ${VENUE_LIST_COURTS},
       reviews(rating)`,
    )
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (filters.city) {
    query = query.eq('city', filters.city)
  }
  if (filters.district) {
    query = query.eq('district', filters.district)
  }
  if (filters.sport) {
    query = query.eq('venue_sports.sports.slug', filters.sport)
  }
  if (filters.q) {
    query = query.ilike('name', `%${filters.q}%`)
  }
  // Olanaklar: seçilenlerin HEPSİ tesiste bulunmalı
  if (filters.amenities && filters.amenities.length > 0) {
    query = query.contains('amenities', filters.amenities)
  }

  // Müsaitlik: seçilen gün+saatte uygun tesisleri sunucudan (RPC) al, listeyi daralt
  if (filters.time) {
    const date = filters.date || nowInIstanbul().date
    const endTime = minutesToTime(timeToMinutes(filters.time) + 60)
    const { data: available, error: availError } = await supabase.rpc('venues_available_at', {
      p_date: date,
      p_start: filters.time,
      p_end: endTime,
    })
    if (availError) {
      throw new Error('Müsaitlik hesaplanamadı')
    }
    const ids = (available ?? []).map((row) => row.venue_id)
    if (ids.length === 0) return []
    query = query.in('id', ids)
  }

  const { data, error } = await query.returns<VenueListRow[]>()
  if (error) {
    throw new Error('Tesisler yüklenemedi')
  }

  let items = data.map(mapVenueListRow)

  // Kapalı/açık saha filtresi (istemcide — saha türü satır eşlemesinde hesaplandı)
  if (filters.court === 'indoor') {
    items = items.filter((venue) => venue.hasIndoor)
  } else if (filters.court === 'outdoor') {
    items = items.filter((venue) => venue.hasOutdoor)
  }

  // Not: sıralama bilinçli olarak burada YAPILMAZ — sort queryKey'e girerse her
  // sıralama değişimi aynı veriyi yeniden indirir. Bileşen sortVenues ile sıralar.
  return items
}

interface VenueDetailRow extends Venue {
  venue_sports: { sports: Sport | null }[]
  venue_images: VenueImage[]
  courts: (Court & { price_rules: PriceRule[]; sports: Sport | null })[]
  opening_hours: OpeningHour[]
}

export async function getVenueBySlug(slug: string): Promise<VenueDetail | null> {
  const { data, error } = await supabase
    .from('venues')
    .select(
      `*,
       venue_sports(sports(*)),
       venue_images(*),
       courts(*, price_rules(*), sports(*)),
       opening_hours(*)`,
    )
    .eq('slug', slug)
    .maybeSingle<VenueDetailRow>()

  if (error) {
    throw new Error('Tesis bilgisi yüklenemedi')
  }
  if (!data) return null

  const { venue_sports, venue_images, courts, opening_hours, ...venue } = data
  return {
    ...venue,
    sports: venue_sports.map((vs) => vs.sports).filter((sport): sport is Sport => sport !== null),
    images: [...venue_images].sort((a, b) => a.sort_order - b.sort_order),
    courts: courts
      .filter((court) => court.is_active)
      .map(({ price_rules, sports, ...court }) => ({
        ...court,
        priceRules: price_rules,
        sport: sports,
      })),
    openingHours: opening_hours,
  }
}
