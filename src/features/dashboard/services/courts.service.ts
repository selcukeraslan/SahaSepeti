import { supabase } from '@/lib/supabase'
import type { Court, OpeningHour, PriceRule, Sport } from '@/types/database.types'
import {
  courtSchema,
  openingHoursSchema,
  priceRuleSchema,
  type CourtInput,
  type OpeningHourInput,
  type PriceRuleInput,
} from '../schemas'

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
