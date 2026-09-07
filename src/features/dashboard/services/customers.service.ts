import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { uuid } from '@/lib/validation'
import { customerSearchSchema, customerSummarySchema, saveCustomerSchema,
  type CustomerSearch, type SaveCustomerInput } from '../customers.schemas'

export async function searchCustomers(input: CustomerSearch) {
  const data = customerSearchSchema.parse(input)
  const result = await supabase.rpc('search_venue_customers', {
    p_venue_id: data.venueId, p_query: data.query, p_filter: data.filter, p_limit: data.limit, p_offset: data.offset,
  })
  if (result.error) throw new Error('Müşteri rehberi yüklenemedi')
  return z.array(customerSummarySchema).parse(result.data)
}
export async function saveCustomer(input: SaveCustomerInput) {
  const parsed = saveCustomerSchema.parse(input)
  const { data, error } = await supabase.rpc('save_venue_customer', { p_input: parsed })
  if (error) throw new Error(error.code === 'P0001' ? error.message : 'Müşteri kaydedilemedi')
  return getCustomer(data)
}
export async function getCustomer(id: string) {
  const { data, error } = await supabase.from('venue_customers').select('*').eq('id', uuid().parse(id)).single()
  if (error) throw new Error('Müşteri bilgileri yüklenemedi')
  return data
}
export async function deleteCustomer(id: string) {
  const { error } = await supabase.rpc('delete_venue_customer', { p_id: uuid().parse(id) })
  if (error) throw new Error(error.code === 'P0001' ? error.message : 'Müşteri silinemedi')
}
export async function getCustomerHistory(id: string, page: number) {
  const { data, error } = await supabase.from('reservations')
    .select('id,reservation_date,start_time,end_time,status,no_show,total_price')
    .eq('venue_customer_id', uuid().parse(id)).eq('series_superseded', false)
    .order('reservation_date', { ascending: false }).order('id').range(page * 20, page * 20 + 19)
  if (error) throw new Error('Müşteri geçmişi yüklenemedi')
  return data
}
export async function resolveSeriesCustomer(id: string, venueId: string) {
  const customer = await getCustomer(id)
  if (customer.venue_id !== venueId) throw new Error('Müşteri bu tesise ait değil')
  if (customer.is_blacklisted) throw new Error('Müşteri kara listede; rezervasyon oluşturulamaz')
  return { guestName: customer.display_name, guestPhone: customer.normalized_phone }
}
