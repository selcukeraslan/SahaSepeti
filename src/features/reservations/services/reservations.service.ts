import { supabase } from '@/lib/supabase'
import type { Reservation } from '@/types/database.types'
import {
  cancelReservationSchema,
  createReservationSchema,
  type CancelReservationInput,
  type CreateReservationInput,
} from '../schemas'
import type { ReservationWithVenue } from '../types'
import { priceChangedError } from './priceQuote'

/** Postgres exclusion constraint ihlali (çakışan rezervasyon) */
const EXCLUSION_VIOLATION = '23P01'

export async function createReservation(input: CreateReservationInput): Promise<Reservation> {
  const data = createReservationSchema.parse(input)

  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) {
    throw new Error('Rezervasyon için giriş yapmalısınız')
  }

  // Trigger nihai fiyatı sunucuda hesaplar; RPC de istemcinin gördüğü
  // teklif ile bu nihai fiyatın aynı işlemde eşleşmesini kontrol eder.
  const { data: reservation, error } = await supabase.rpc('create_marketplace_reservation', {
    p_court_id: data.courtId,
    p_venue_id: data.venueId,
    p_reservation_date: data.date,
    p_start_time: data.startTime,
    p_end_time: data.endTime,
    p_expected_total_price: data.expectedTotalPrice,
    p_notes: data.notes || null,
  })

  if (error) {
    if (error.code === 'PGRST203' || error.code === 'PGRST202') {
      throw new Error('Rezervasyon servisi güncelleniyor. Lütfen kısa süre sonra tekrar deneyin.')
    }
    if (error.code === EXCLUSION_VIOLATION) {
      throw new Error('Bu saat az önce doldu. Lütfen başka bir saat seçin.')
    }
    if (error.code === 'P0002') {
      throw priceChangedError(error.details)
    }
    throw new Error(error.message || 'Rezervasyon oluşturulamadı')
  }
  if (!reservation || typeof reservation !== 'object') {
    throw new Error('Rezervasyon oluşturulamadı')
  }
  return reservation as unknown as Reservation
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
