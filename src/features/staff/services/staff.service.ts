import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { uuid } from '@/lib/validation'
import { inviteResultSchema, inviteTokenSchema, staffActionSchema, staffRoleSchema, type StaffAction } from '../schemas'

export async function listStaff(venueId: string) {
  const { data, error } = await supabase.rpc('list_venue_staff', { p_venue_id: uuid().parse(venueId) })
  if (error) throw new Error('Personel listesi yüklenemedi')
  return z.array(z.object({ id: uuid(), venue_id: uuid(), user_id: uuid(), role: staffRoleSchema,
    full_name: z.string(), created_at: z.string() })).parse(data)
}

export async function listPanelVenues() {
  const { data, error } = await supabase.rpc('list_panel_venues')
  if (error) throw new Error('Panel yetkileri yüklenemedi. Veritabanı güncellemesini kontrol edin.')
  return z.array(z.object({ id: uuid(), name: z.string(), role: z.enum(['owner','admin','manager','reception','viewer']) })).parse(data)
}

export async function listStaffInvites(venueId: string) {
  const { data, error } = await supabase.from('staff_invites')
    .select('id,venue_id,email,role,invited_by,expires_at,accepted_at,revoked_at,created_at,updated_at')
    .eq('venue_id', uuid().parse(venueId)).is('accepted_at', null).is('revoked_at', null)
    .order('created_at', { ascending: false }).order('id')
  if (error) throw new Error('Personel davetleri yüklenemedi')
  return data
}

export async function manageStaff(input: StaffAction) {
  const parsed = staffActionSchema.parse(input)
  const { data, error } = await supabase.rpc('manage_venue_staff', { p_input: parsed })
  if (error) throw new Error(error.code === 'P0001' ? error.message : 'Personel işlemi tamamlanamadı')
  if (parsed.action === 'invite') return inviteResultSchema.parse(data)
  z.object({ success: z.literal(true) }).parse(data)
  return null
}

export async function acceptStaffInvite(token: string) {
  const { data, error } = await supabase.rpc('accept_staff_invite', { p_token: inviteTokenSchema.parse(token) })
  if (error) throw new Error(error.code === 'P0001' ? error.message : 'Personel daveti kabul edilemedi')
  return uuid().parse(data)
}
