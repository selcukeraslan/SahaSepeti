import { supabase } from '@/lib/supabase'
import type { Reservation, ReservationStatus, Venue, VenueStatus } from '@/types/database.types'

// ---------- Tesis yönetimi ----------

export interface AdminVenue extends Venue {
  owner: { full_name: string; phone: string | null } | null
}

export async function listAllVenues(status?: VenueStatus): Promise<AdminVenue[]> {
  let query = supabase
    .from('venues')
    .select('*, profiles!venues_owner_id_fkey(full_name, phone)')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw new Error('Tesisler yüklenemedi')

  return data.map((row) => {
    const { profiles, ...venue } = row as Venue & {
      profiles: { full_name: string; phone: string | null } | null
    }
    return { ...venue, owner: profiles }
  })
}

export async function approveVenue(venueId: string): Promise<void> {
  const { error } = await supabase
    .from('venues')
    .update({ status: 'approved', rejection_reason: null })
    .eq('id', venueId)
  if (error) throw new Error('Tesis onaylanamadı')
}

export async function rejectVenue(venueId: string, reason: string): Promise<void> {
  const { error } = await supabase
    .from('venues')
    .update({ status: 'rejected', rejection_reason: reason })
    .eq('id', venueId)
  if (error) throw new Error('Tesis reddedilemedi')
}

export async function suspendVenue(venueId: string): Promise<void> {
  const { error } = await supabase.from('venues').update({ status: 'suspended' }).eq('id', venueId)
  if (error) throw new Error('Tesis askıya alınamadı')
}

// ---------- Rezervasyon görünümü (salt okunur) ----------

export interface AdminReservation extends Reservation {
  venue: { name: string } | null
  court: { name: string } | null
  customer: { full_name: string } | null
}

export interface AdminReservationFilters {
  status?: ReservationStatus
  date?: string
}

export async function listAllReservations(
  filters: AdminReservationFilters,
): Promise<AdminReservation[]> {
  let query = supabase
    .from('reservations')
    .select(
      `*,
       venues(name),
       courts(name),
       profiles!reservations_customer_id_fkey(full_name)`,
    )
    .order('reservation_date', { ascending: false })
    .order('start_time', { ascending: false })
    .limit(200)

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.date) query = query.eq('reservation_date', filters.date)

  const { data, error } = await query
  if (error) throw new Error('Rezervasyonlar yüklenemedi')

  return data.map((row) => {
    const { venues, courts, profiles, ...reservation } = row as Reservation & {
      venues: { name: string } | null
      courts: { name: string } | null
      profiles: { full_name: string } | null
    }
    return { ...reservation, venue: venues, court: courts, customer: profiles }
  })
}
