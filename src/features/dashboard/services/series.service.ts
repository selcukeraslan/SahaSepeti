import { supabase } from '@/lib/supabase'
import { resolveSeriesCustomer } from './customers.service'
import { seriesInputSchema, seriesResultSchema, type SeriesInput } from '../series.schemas'

export async function manageSeries(input: SeriesInput, preview: boolean) {
  const parsed = seriesInputSchema.parse(input)
  if (parsed.action === 'create' && parsed.venueCustomerId) {
    Object.assign(parsed, await resolveSeriesCustomer(parsed.venueCustomerId, parsed.venueId))
  }
  const { data, error } = await supabase.rpc('manage_reservation_series', { p_input: parsed, p_preview: preview })
  if (error) throw new Error(error.code === 'P0001' ? error.message : 'Seri işlemi yapılamadı. Bilgileri kontrol edip tekrar deneyin.')
  return seriesResultSchema.parse(data)
}

export async function listSeriesOccurrences(seriesId: string) {
  const { data, error } = await supabase.from('reservations')
    .select('id, reservation_date, start_time, end_time, status, total_price')
    .eq('series_id', seriesId).eq('series_superseded', false).order('reservation_date')
  if (error) throw new Error('Serinin haftaları yüklenemedi')
  return data
}
