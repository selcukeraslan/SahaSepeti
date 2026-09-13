import { z } from 'zod'
import { uuid } from '@/lib/validation'

export const staffRoleSchema = z.enum(['manager', 'reception', 'viewer'])
export const inviteTokenSchema = z.string().regex(/^[a-f0-9]{64}$/, 'Geçersiz davet bağlantısı')
export const staffActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('invite'), venueId: uuid(),
    email: z.string().trim().toLowerCase().email('Geçerli e-posta girin').max(254), role: staffRoleSchema }).strict(),
  z.object({ action: z.literal('revoke_invite'), venueId: uuid(), id: uuid() }).strict(),
  z.object({ action: z.literal('change_role'), venueId: uuid(), id: uuid(), role: staffRoleSchema }).strict(),
  z.object({ action: z.literal('remove'), venueId: uuid(), id: uuid() }).strict(),
])
export const inviteResultSchema = z.object({ id: uuid(), token: inviteTokenSchema, expiresAt: z.string().datetime({ offset: true }) })
export type StaffAction = z.infer<typeof staffActionSchema>

export const STAFF_ROLE_LABELS = { manager: 'Yönetici', reception: 'Resepsiyon', viewer: 'Görüntüleyici' } as const

// UI hints only. Database checks are authoritative and will be connected to
// operational policies in the next phase-17 step, not via owns_venue expansion.
export const STAFF_PERMISSIONS = {
  manager: ['calendar.read', 'reservations.write', 'customers.read', 'customers.write', 'reports.read', 'venue.write', 'staff.manage'],
  reception: ['calendar.read', 'reservations.write', 'customers.read', 'customers.write'],
  viewer: ['calendar.read'],
} as const
