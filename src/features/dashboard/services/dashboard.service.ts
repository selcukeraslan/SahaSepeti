import { supabase } from '@/lib/supabase'
import { slugifyUnique } from '@/lib/utils'
import type {
  Court,
  OpeningHour,
  PriceRule,
  Reservation,
  ReservationStatus,
  Sport,
  TablesUpdate,
  Venue,
} from '@/types/database.types'
import {
  courtSchema,
  openingHoursSchema,
  priceRuleSchema,
  venueSchema,
  type CourtInput,
  type OpeningHourInput,
  type PriceRuleInput,
  type VenueInput,
} from '../schemas'

// ---------- Tesisler ----------

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
  const { error: deleteError } = await supabase
    .from('venue_sports')
    .delete()
    .eq('venue_id', venueId)
  if (deleteError) throw new Error('Spor türleri güncellenemedi')

  const { error: insertError } = await supabase
    .from('venue_sports')
    .insert(sportIds.map((sportId) => ({ venue_id: venueId, sport_id: sportId })))
  if (insertError) throw new Error('Spor türleri güncellenemedi')
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

// ---------- Sahalar ----------

export async function listVenueCourts(venueId: string): Promise<(Court & { sport: Sport | null })[]> {
  const { data, error } = await supabase
    .from('courts')
    .select('*, sports(*)')
    .eq('venue_id', venueId)
    .order('created_at')

  if (error) throw new Error('Sahalar yüklenemedi')
  return data.map((row) => {
    const { sports, ...court } = row as Court & { sports: Sport | null }
    return { ...court, sport: sports }
  })
}

export async function createCourt(venueId: string, input: CourtInput): Promise<Court> {
  const data = courtSchema.parse(input)
  const { data: court, error } = await supabase
    .from('courts')
    .insert({
      venue_id: venueId,
      sport_id: data.sportId,
      name: data.name,
      surface_type: data.surfaceType || null,
      is_indoor: data.isIndoor,
      capacity: data.capacity ?? null,
    })
    .select()
    .single()

  if (error) throw new Error('Saha eklenemedi')
  return court
}

export async function updateCourt(courtId: string, input: CourtInput): Promise<void> {
  const data = courtSchema.parse(input)
  const { error } = await supabase
    .from('courts')
    .update({
      sport_id: data.sportId,
      name: data.name,
      surface_type: data.surfaceType || null,
      is_indoor: data.isIndoor,
      capacity: data.capacity ?? null,
    })
    .eq('id', courtId)

  if (error) throw new Error('Saha güncellenemedi')
}

export async function setCourtActive(courtId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from('courts').update({ is_active: isActive }).eq('id', courtId)
  if (error) throw new Error('Saha durumu güncellenemedi')
}

// ---------- Çalışma saatleri ----------

export async function getOpeningHours(venueId: string): Promise<OpeningHour[]> {
  const { data, error } = await supabase
    .from('opening_hours')
    .select('*')
    .eq('venue_id', venueId)
    .order('day_of_week')

  if (error) throw new Error('Çalışma saatleri yüklenemedi')
  return data
}

export async function saveOpeningHours(
  venueId: string,
  hours: OpeningHourInput[],
): Promise<void> {
  const data = openingHoursSchema.parse(hours)
  const { error } = await supabase.from('opening_hours').upsert(
    data.map((hour) => ({
      venue_id: venueId,
      day_of_week: hour.dayOfWeek,
      open_time: hour.openTime,
      close_time: hour.closeTime,
      is_closed: hour.isClosed,
    })),
    { onConflict: 'venue_id,day_of_week' },
  )
  if (error) throw new Error('Çalışma saatleri kaydedilemedi')
}

// ---------- Fiyat kuralları ----------

export async function listCourtPriceRules(courtId: string): Promise<PriceRule[]> {
  const { data, error } = await supabase
    .from('price_rules')
    .select('*')
    .eq('court_id', courtId)
    .order('day_of_week', { ascending: true, nullsFirst: true })
    .order('start_time')

  if (error) throw new Error('Fiyat kuralları yüklenemedi')
  return data
}

export async function createPriceRule(courtId: string, input: PriceRuleInput): Promise<void> {
  const data = priceRuleSchema.parse(input)
  const { error } = await supabase.from('price_rules').insert({
    court_id: courtId,
    day_of_week: data.dayOfWeek,
    start_time: data.startTime,
    end_time: data.endTime,
    price: data.price,
  })
  if (error) throw new Error('Fiyat kuralı eklenemedi')
}

export async function deletePriceRule(ruleId: string): Promise<void> {
  const { error } = await supabase.from('price_rules').delete().eq('id', ruleId)
  if (error) throw new Error('Fiyat kuralı silinemedi')
}

// ---------- Rezervasyon yönetimi ----------

export interface OwnerReservation extends Reservation {
  court: { name: string } | null
  venue: { name: string } | null
  customer: { full_name: string; phone: string | null } | null
}

export interface OwnerReservationFilters {
  venueId?: string
  status?: ReservationStatus
  /** yyyy-MM-dd */
  date?: string
}

export async function listOwnerReservations(
  filters: OwnerReservationFilters,
): Promise<OwnerReservation[]> {
  let query = supabase
    .from('reservations')
    .select(
      `*,
       courts(name),
       venues(name),
       profiles!reservations_customer_id_fkey(full_name, phone)`,
    )
    .order('reservation_date', { ascending: false })
    .order('start_time', { ascending: false })
    .limit(200)

  if (filters.venueId) query = query.eq('venue_id', filters.venueId)
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.date) query = query.eq('reservation_date', filters.date)

  const { data, error } = await query
  if (error) throw new Error('Rezervasyonlar yüklenemedi')

  return data.map((row) => {
    const { courts, venues, profiles, ...reservation } = row as Reservation & {
      courts: { name: string } | null
      venues: { name: string } | null
      profiles: { full_name: string; phone: string | null } | null
    }
    return { ...reservation, court: courts, venue: venues, customer: profiles }
  })
}

export async function updateReservationStatus(
  reservationId: string,
  status: ReservationStatus,
): Promise<void> {
  const update: TablesUpdate<'reservations'> = { status }
  if (status === 'cancelled') {
    update.cancelled_at = new Date().toISOString()
    update.cancellation_reason = 'Tesis tarafından iptal edildi'
  }
  const { error } = await supabase.from('reservations').update(update).eq('id', reservationId)
  if (error) throw new Error('Rezervasyon durumu güncellenemedi')
}
