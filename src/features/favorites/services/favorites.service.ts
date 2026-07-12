import { supabase } from '@/lib/supabase'
import { mapVenueListRow, type VenueListRow } from '@/features/venues/services/venues.service'
import type { VenueListItem } from '@/features/venues/types'

/** Zaten favoride (PK ihlali) — sessizce yok say */
const UNIQUE_VIOLATION = '23505'

export async function listFavoriteIds(): Promise<string[]> {
  // RLS yalnızca oturum sahibinin favorilerini döner
  const { data, error } = await supabase.from('favorites').select('venue_id')
  if (error) {
    throw new Error('Favoriler yüklenemedi')
  }
  return data.map((row) => row.venue_id)
}

interface FavoriteVenueRow {
  venue: VenueListRow | null
}

export async function listFavoriteVenues(): Promise<VenueListItem[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select(
      `venue:venues(*,
         venue_sports(sports(*)),
         courts(price_rules(price)),
         reviews(rating))`,
    )
    .order('created_at', { ascending: false })
    .returns<FavoriteVenueRow[]>()

  if (error) {
    throw new Error('Favoriler yüklenemedi')
  }

  // Onaylı olmayan/gizlenen (RLS) tesisler null döner → ayıklanır
  return data
    .map((row) => row.venue)
    .filter((venue): venue is VenueListRow => venue !== null)
    .map(mapVenueListRow)
}

export async function addFavorite(venueId: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) {
    throw new Error('Favorilere eklemek için giriş yapmalısınız')
  }
  const { error } = await supabase
    .from('favorites')
    .insert({ customer_id: auth.user.id, venue_id: venueId })
  if (error && error.code !== UNIQUE_VIOLATION) {
    throw new Error('Favorilere eklenemedi')
  }
}

export async function removeFavorite(venueId: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) {
    throw new Error('Giriş yapmalısınız')
  }
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('customer_id', auth.user.id)
    .eq('venue_id', venueId)
  if (error) {
    throw new Error('Favorilerden çıkarılamadı')
  }
}
