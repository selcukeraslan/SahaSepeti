import { parseISO } from 'date-fns'
import {
  generateSlots,
  nowInIstanbul,
  timeToMinutes,
} from '@/features/venues/services/slots'
import { supabase } from '@/lib/supabase'
import type {
  OpeningHour,
  PriceRule,
  ReservationStatus,
} from '@/types/database.types'
import {
  blockSlotSchema,
  manualReservationSchema,
  type BlockSlotInput,
  type ManualReservationInput,
} from '../schemas'
import type { CourtSchedule, ScheduleSlot } from '../types'

/** Postgres exclusion constraint ihlali (çakışan slot) */
const EXCLUSION_VIOLATION = '23P01'

interface ScheduleCourtRow {
  id: string
  name: string
  is_indoor: boolean
  price_rules: PriceRule[]
}

interface ScheduleReservationRow {
  id: string
  court_id: string
  start_time: string
  end_time: string
  status: ReservationStatus
  is_block: boolean
  no_show: boolean
  guest_name: string | null
  guest_phone: string | null
  notes: string | null
  profiles: { full_name: string; phone: string | null } | null
}

/** Owner takvimi: seçili tesis + gün için her sahanın slotları (rezervasyon detaylı). */
export async function listOwnerDaySchedule(venueId: string, date: string): Promise<CourtSchedule[]> {
  const [courtsRes, hoursRes, reservationsRes] = await Promise.all([
    supabase
      .from('courts')
      .select('id, name, is_indoor, price_rules(*)')
      .eq('venue_id', venueId)
      .eq('is_active', true)
      .order('created_at')
      .returns<ScheduleCourtRow[]>(),
    supabase.from('opening_hours').select('*').eq('venue_id', venueId).returns<OpeningHour[]>(),
    supabase
      .from('reservations')
      .select(
        'id, court_id, start_time, end_time, status, is_block, no_show, guest_name, guest_phone, notes, profiles!reservations_customer_id_fkey(full_name, phone)',
      )
      .eq('venue_id', venueId)
      .eq('reservation_date', date)
      .neq('status', 'cancelled')
      .returns<ScheduleReservationRow[]>(),
  ])

  if (courtsRes.error || hoursRes.error || reservationsRes.error) {
    throw new Error('Takvim yüklenemedi')
  }

  const dayOfWeek = parseISO(date).getDay()
  const today = nowInIstanbul()
  // Geçmiş gün → tüm slotlar "geçti" (tıklanamaz); bugün → şu anki dakika; gelecek → null
  const nowMinutes =
    date < today.date ? Number.MAX_SAFE_INTEGER : date === today.date ? today.minutes : null

  return courtsRes.data.map((court) => {
    const openingHour = hoursRes.data.find((hour) => hour.day_of_week === dayOfWeek)
    const courtReservations = reservationsRes.data.filter((r) => r.court_id === court.id)

    const baseSlots = generateSlots({
      openingHour,
      priceRules: court.price_rules,
      bookedRanges: courtReservations.map((r) => ({
        start_time: r.start_time,
        end_time: r.end_time,
      })),
      dayOfWeek,
      nowMinutes,
    })

    const slots: ScheduleSlot[] = baseSlots.map((slot) => {
      const slotStart = timeToMinutes(slot.startTime)
      const slotEnd = timeToMinutes(slot.endTime)
      const match = courtReservations.find(
        (r) => slotStart < timeToMinutes(r.end_time) && timeToMinutes(r.start_time) < slotEnd,
      )
      if (!match) return { ...slot, reservation: null }
      return {
        ...slot,
        // Rezervasyonlu slot geçmişte bile "dolu" gösterilir (owner kimin aldığını görsün)
        status: match.is_block ? 'blocked' : 'booked',
        reservation: {
          id: match.id,
          status: match.status,
          isBlock: match.is_block,
          noShow: match.no_show,
          // RLS: owner yalnızca blok ya da misafir (customer_id null → profiles null) siler
          deletable: match.is_block || match.profiles === null,
          customerName: match.profiles?.full_name || match.guest_name || 'Müşteri',
          customerPhone: match.profiles?.phone ?? match.guest_phone,
          notes: match.notes,
        },
      }
    })

    return {
      courtId: court.id,
      courtName: court.name,
      isIndoor: court.is_indoor,
      isClosedToday: !openingHour || openingHour.is_closed,
      slots,
    }
  })
}

export async function createManualReservation(input: ManualReservationInput): Promise<void> {
  const data = manualReservationSchema.parse(input)
  const { error } = await supabase.from('reservations').insert({
    court_id: data.courtId,
    venue_id: data.venueId,
    customer_id: null,
    reservation_date: data.date,
    start_time: data.startTime,
    end_time: data.endTime,
    status: 'confirmed',
    guest_name: data.guestName,
    guest_phone: data.guestPhone || null,
    notes: data.notes || null,
  })
  if (error) {
    if (error.code === EXCLUSION_VIOLATION) {
      throw new Error('Bu saat dolu — çakışan bir kayıt var.')
    }
    // Ham Postgres/trigger mesajını sızdırma
    throw new Error('Rezervasyon eklenemedi. Bilgileri kontrol edip tekrar deneyin.')
  }
}

export async function createBlockSlot(input: BlockSlotInput): Promise<void> {
  const data = blockSlotSchema.parse(input)
  const { error } = await supabase.from('reservations').insert({
    court_id: data.courtId,
    venue_id: data.venueId,
    customer_id: null,
    reservation_date: data.date,
    start_time: data.startTime,
    end_time: data.endTime,
    status: 'confirmed',
    is_block: true,
    notes: data.reason || null,
  })
  if (error) {
    if (error.code === EXCLUSION_VIOLATION) {
      throw new Error('Bu saat dolu — çakışan bir kayıt var.')
    }
    throw new Error('Saat bloklanamadı. Lütfen tekrar deneyin.')
  }
}

/** No-show işaretle/kaldır (owner). */
export async function setReservationNoShow(reservationId: string, value: boolean): Promise<void> {
  const { error } = await supabase
    .from('reservations')
    .update({ no_show: value })
    .eq('id', reservationId)
  if (error) {
    if (error.message.includes('No-show yalnızca başlamış')) {
      throw new Error('No-show yalnızca rezervasyon başladıktan sonra işaretlenebilir')
    }
    throw new Error('No-show güncellenemedi')
  }
}

/** Blok veya misafir kaydını sil (RLS: yalnızca owner, yalnızca blok/misafir). */
export async function deleteOwnerReservation(reservationId: string): Promise<void> {
  const { error } = await supabase.from('reservations').delete().eq('id', reservationId)
  if (error) throw new Error('Kayıt silinemedi')
}
