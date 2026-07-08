import { z } from 'zod'

const dateRegex = /^\d{4}-\d{2}-\d{2}$/
const timeRegex = /^\d{2}:\d{2}$/

export const createReservationSchema = z.object({
  courtId: z.string().uuid('Geçersiz saha'),
  venueId: z.string().uuid('Geçersiz tesis'),
  date: z.string().regex(dateRegex, 'Geçersiz tarih'),
  startTime: z.string().regex(timeRegex, 'Geçersiz saat'),
  endTime: z.string().regex(timeRegex, 'Geçersiz saat'),
  notes: z.string().max(500, 'Not en fazla 500 karakter olabilir').optional(),
})

export type CreateReservationInput = z.infer<typeof createReservationSchema>

export const cancelReservationSchema = z.object({
  reservationId: z.string().uuid(),
  reason: z.string().max(300, 'Gerekçe en fazla 300 karakter olabilir').optional(),
})

export type CancelReservationInput = z.infer<typeof cancelReservationSchema>
