import { z } from 'zod'
import { uuid } from '@/lib/validation'

export const customerFilterSchema = z.enum(['all', 'active', 'blacklist', 'no_show'])
export type CustomerFilter = z.infer<typeof customerFilterSchema>
export const customerSearchSchema = z.object({
  venueId: uuid(), query: z.string().trim().max(80), filter: customerFilterSchema,
  limit: z.number().int().min(1).max(50), offset: z.number().int().min(0),
})
export type CustomerSearch = z.infer<typeof customerSearchSchema>
export const saveCustomerSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('create'), venueId: uuid(), name: z.string().trim().min(2, 'Müşteri adı en az 2 karakter olmalı').max(80),
    phone: z.string().trim().min(10, 'Geçerli bir Türkiye telefonu girin').max(30) }),
  z.object({ action: z.literal('notes'), id: uuid(), notes: z.string().max(1000) }),
  z.object({ action: z.literal('blacklist'), id: uuid(), blocked: z.boolean(),
    reason: z.string().trim().min(3, 'En az 3 karakterlik gerekçe girin').max(300) }),
])
export type SaveCustomerInput = z.infer<typeof saveCustomerSchema>
export const customerSummarySchema = z.object({
  id: z.string(), display_name: z.string(), masked_phone: z.string(), is_blacklisted: z.boolean(),
  last_booking_at: z.string().nullable(), total_count: z.number(), cancel_count: z.number(),
  no_show_count: z.number(), last_visit: z.string().nullable(),
})
export type CustomerSummary = z.infer<typeof customerSummarySchema>
