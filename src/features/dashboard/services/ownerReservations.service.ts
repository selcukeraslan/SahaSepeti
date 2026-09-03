import { supabase } from '@/lib/supabase'
import type {
  Reservation,
  ReservationStatus,
  TablesUpdate,
} from '@/types/database.types'
import type { StatsReservation } from './stats'

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

/**
 * İstatistik için minimal alanlar. RLS, owner'a yalnızca kendi tesislerinin
 * rezervasyonlarını döndürür; venueId verilirse tek tesise daraltılır.
 */
export async function listOwnerReservationsForStats(venueId?: string): Promise<StatsReservation[]> {
  let query = supabase
    .from('reservations')
    .select('reservation_date, start_time, status, total_price, venue_id')
    .order('reservation_date', { ascending: false })
    .limit(2000)

  if (venueId) query = query.eq('venue_id', venueId)

  const { data, error } = await query
  if (error) throw new Error('İstatistik verisi yüklenemedi')
  return data
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
  if (error) {
    if (error.message.includes('Gelecekteki rezervasyon')) {
      throw new Error('Rezervasyon, bitiş saatinden önce tamamlanamaz')
    }
    throw new Error('Rezervasyon durumu güncellenemedi')
  }
}
