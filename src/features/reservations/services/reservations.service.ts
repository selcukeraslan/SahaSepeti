import { supabase } from '@/lib/supabase'
import type { Reservation } from '@/types/database.types'
import {
  cancelReservationSchema,
  createReservationSchema,
  type CancelReservationInput,
  type CreateReservationInput,
} from '../schemas'
import type { ReservationWithVenue } from '../types'

/** Postgres exclusion constraint ihlali (çakışan rezervasyon) */
const EXCLUSION_VIOLATION = '23P01'

export async function createReservation(input: CreateReservationInput): Promise<Reservation> {
  const data = createReservationSchema.parse(input)

  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) {
    throw new Error('Rezervasyon için giriş yapmalısınız')
  }

  // total_price ve venue_id sunucu tarafında (trigger) doğrulanır/hesaplanır.
  const { data: reservation, error } = await supabase
    .from('reservations')
    .insert({
      court_id: data.courtId,
      venue_id: data.venueId,
      customer_id: auth.user.id,
      reservation_date: data.date,
      start_time: data.startTime,
      end_time: data.endTime,
      notes: data.notes || null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === EXCLUSION_VIOLATION) {
      throw new Error('Bu saat az önce doldu. Lütfen başka bir saat seçin.')
    }
    throw new Error(error.message || 'Rezervasyon oluşturulamadı')
  }
  return reservation
}

export async function listMyReservations(): Promise<ReservationWithVenue[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select(
      `*,
       venues(name, slug, city, district, cover_image_url),
       courts(name)`,
    )
    .order('reservation_date', { ascending: false })
    .order('start_time', { ascending: false })

  if (error) {
    throw new Error('Rezervasyonlar yüklenemedi')
  }

  return data.map((row) => {
    const { venues, courts, ...reservation } = row as Reservation & {
      venues: ReservationWithVenue['venue']
      courts: ReservationWithVenue['court']
    }
    return { ...reservation, venue: venues, court: courts }
  })
}

export async function cancelReservation(input: CancelReservationInput): Promise<void> {
  const data = cancelReservationSchema.parse(input)

  const { data: updated, error } = await supabase
    .from('reservations')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: data.reason || null,
    })
    .eq('id', data.reservationId)
    .select('id')

  if (error) {
    // DB trigger'ı zamanı geçmiş rezervasyon iptalini engeller
    if (error.message.includes('geçmiş')) {
      throw new Error('Saati geçmiş rezervasyon iptal edilemez')
    }
    throw new Error('Rezervasyon iptal edilemedi')
  }
  if (!updated || updated.length === 0) {
    throw new Error('Rezervasyon bulunamadı veya iptal yetkiniz yok')
  }
}
