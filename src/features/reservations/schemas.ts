import { z } from 'zod'
import { uuid } from '@/lib/validation'

const dateRegex = /^\d{4}-\d{2}-\d{2}$/
const timeRegex = /^\d{2}:\d{2}$/

export const createReservationSchema = z.object({
  courtId: uuid('Geçersiz saha'),
  venueId: uuid('Geçersiz tesis'),
  date: z.string().regex(dateRegex, 'Geçersiz tarih'),
  startTime: z.string().regex(timeRegex, 'Geçersiz saat'),
  endTime: z.string().regex(timeRegex, 'Geçersiz saat'),
  notes: z.string().max(500, 'Not en fazla 500 karakter olabilir').optional(),
})

export type CreateReservationInput = z.infer<typeof createReservationSchema>

export const cancelReservationSchema = z.object({
  reservationId: uuid(),
  reason: z.string().max(300, 'Gerekçe en fazla 300 karakter olabilir').optional(),
})

export type CancelReservationInput = z.infer<typeof cancelReservationSchema>
