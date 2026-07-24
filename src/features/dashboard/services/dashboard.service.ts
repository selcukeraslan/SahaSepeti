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
  blockSlotSchema,
  courtSchema,
  manualReservationSchema,
  openingHoursSchema,
  priceRuleSchema,
  venueSchema,
  type BlockSlotInput,
  type CourtInput,
  type ManualReservationInput,
  type OpeningHourInput,
  type PriceRuleInput,
  type VenueInput,
} from '../schemas'
import type { StatsReservation } from './stats'
import type { CourtSchedule, ScheduleSlot } from '../types'
import {
  generateSlots,
  nowInIstanbul,
  timeToMinutes,
} from '@/features/venues/services/slots'
import { parseISO } from 'date-fns'

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
  if (error) throw new Error('Rezervasyon durumu güncellenemedi')
}

// ---------- Owner takvim + manuel rezervasyon + blok + no-show ----------

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
  if (error) throw new Error('No-show güncellenemedi')
}

/** Blok veya misafir kaydını sil (RLS: yalnızca owner, yalnızca blok/misafir). */
export async function deleteOwnerReservation(reservationId: string): Promise<void> {
  const { error } = await supabase.from('reservations').delete().eq('id', reservationId)
  if (error) throw new Error('Kayıt silinemedi')
}
