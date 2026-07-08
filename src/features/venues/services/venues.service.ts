import { supabase } from '@/lib/supabase'
import type { Court, OpeningHour, PriceRule, Sport, Venue, VenueImage } from '@/types/database.types'
import type { VenueDetail, VenueFilters, VenueListItem } from '../types'

export async function listSports(): Promise<Sport[]> {
  const { data, error } = await supabase.from('sports').select('*').order('name')
  if (error) {
    throw new Error('Spor türleri yüklenemedi')
  }
  return data
}

interface VenueListRow extends Venue {
  venue_sports: { sports: Sport | null }[]
  courts: { price_rules: Pick<PriceRule, 'price'>[] }[]
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
       courts(price_rules(price))`,
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

  const { data, error } = await query.returns<VenueListRow[]>()
  if (error) {
    throw new Error('Tesisler yüklenemedi')
  }

  return data.map((row) => {
    const { venue_sports, courts, ...venue } = row
    const prices = courts.flatMap((court) => court.price_rules.map((rule) => rule.price))
    return {
      ...venue,
      sports: venue_sports.map((vs) => vs.sports).filter((sport): sport is Sport => sport !== null),
      minPrice: prices.length > 0 ? Math.min(...prices) : null,
    }
  })
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
