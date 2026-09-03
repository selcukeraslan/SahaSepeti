import { supabase } from '@/lib/supabase'
import { slugifyUnique } from '@/lib/utils'
import type { Sport, Venue } from '@/types/database.types'
import { venueSchema, type VenueInput } from '../schemas'

export interface OwnerVenue extends Venue {
  sports: Sport[]
}

export async function listMyVenues(): Promise<OwnerVenue[]> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Giriş yapmalısınız')

  const { data, error } = await supabase
    .from('venues')
    .select('*, venue_sports(sports(*))')
    .eq('owner_id', auth.user.id)
    .order('created_at', { ascending: false })

  if (error) throw new Error('Tesisler yüklenemedi')

  return data.map((row) => {
    const { venue_sports, ...venue } = row as Venue & {
      venue_sports: { sports: Sport | null }[]
    }
    return {
      ...venue,
      sports: venue_sports.map((vs) => vs.sports).filter((sport): sport is Sport => sport !== null),
    }
  })
}

async function syncVenueSports(venueId: string, sportIds: string[]): Promise<void> {
  // Transaction olmadan güvenli sıralama: farkı hesapla, ÖNCE ekle SONRA sil.
  // Böylece ekleme başarısız olursa mevcut atamalar kaybolmaz (delete-all riski yok).
  const { data: current, error: readError } = await supabase
    .from('venue_sports')
    .select('sport_id')
    .eq('venue_id', venueId)
  if (readError) throw new Error('Spor türleri güncellenemedi')

  const currentIds = current.map((row) => row.sport_id)
  const toAdd = sportIds.filter((id) => !currentIds.includes(id))
  const toRemove = currentIds.filter((id) => !sportIds.includes(id))

  if (toAdd.length > 0) {
    const { error } = await supabase
      .from('venue_sports')
      .insert(toAdd.map((sportId) => ({ venue_id: venueId, sport_id: sportId })))
    if (error) throw new Error('Spor türleri güncellenemedi')
  }
  if (toRemove.length > 0) {
    const { error } = await supabase
      .from('venue_sports')
      .delete()
      .eq('venue_id', venueId)
      .in('sport_id', toRemove)
    if (error) throw new Error('Spor türleri güncellenemedi')
  }
}

export async function createVenue(input: VenueInput): Promise<Venue> {
  const data = venueSchema.parse(input)
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Giriş yapmalısınız')

  const { data: venue, error } = await supabase
    .from('venues')
    .insert({
      owner_id: auth.user.id,
      name: data.name,
      slug: slugifyUnique(data.name),
      description: data.description,
      city: data.city,
      district: data.district,
      address: data.address,
      phone: data.phone || null,
      amenities: data.amenities,
      latitude: data.latitude,
      longitude: data.longitude,
      status: 'draft',
    })
    .select()
    .single()

  if (error) throw new Error('Tesis oluşturulamadı')
  await syncVenueSports(venue.id, data.sportIds)
  return venue
}

export async function updateVenue(venueId: string, input: VenueInput): Promise<void> {
  const data = venueSchema.parse(input)

  const { error } = await supabase
    .from('venues')
    .update({
      name: data.name,
      description: data.description,
      city: data.city,
      district: data.district,
      address: data.address,
      phone: data.phone || null,
      amenities: data.amenities,
      latitude: data.latitude,
      longitude: data.longitude,
    })
    .eq('id', venueId)

  if (error) throw new Error('Tesis güncellenemedi')
  await syncVenueSports(venueId, data.sportIds)
}

/** Tesisi admin onayına gönderir (draft/rejected → pending). */
export async function submitVenueForApproval(venueId: string): Promise<void> {
  const { error } = await supabase.from('venues').update({ status: 'pending' }).eq('id', venueId)
  if (error) throw new Error('Tesis onaya gönderilemedi')
}
