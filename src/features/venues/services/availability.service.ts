import { supabase } from '@/lib/supabase'
import type { BookedRange } from './slots'

/**
 * Müsaitlik veri erişimi. Saf slot üretim mantığı için bkz. ./slots.ts
 * Kişisel veri içermeyen doluluk RPC'si (bkz. 003_rls.sql → get_booked_slots).
 */
export async function fetchBookedSlots(venueId: string, date: string): Promise<BookedRange[]> {
  const { data, error } = await supabase.rpc('get_booked_slots', {
    p_venue_id: venueId,
    p_date: date,
  })
  if (error) {
    throw new Error('Müsaitlik bilgisi yüklenemedi')
  }
  return data
}
