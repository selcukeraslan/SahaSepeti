import { z } from 'zod'
import { uuid } from '@/lib/validation'

const dateRegex = /^\d{4}-\d{2}-\d{2}$/
const timeRegex = /^\d{2}:\d{2}$/

export const createReservationSchema = z
  .object({
    courtId: uuid('Geçersiz saha'),
    venueId: uuid('Geçersiz tesis'),
    date: z.string().regex(dateRegex, 'Geçersiz tarih'),
    startTime: z.string().regex(timeRegex, 'Geçersiz saat'),
    endTime: z.string().regex(timeRegex, 'Geçersiz saat'),
    notes: z.string().max(500, 'Not en fazla 500 karakter olabilir').optional(),
  })
  .refine(
    ({ startTime, endTime }) => {
      const [startHour = 0, startMinute = 0] = startTime.split(':').map(Number)
      const [endHour = 0, endMinute = 0] = endTime.split(':').map(Number)
      return endHour * 60 + endMinute - (startHour * 60 + startMinute) === 60
    },
    { message: 'Rezervasyon süresi tam 1 saat olmalı', path: ['endTime'] },
  )

export type CreateReservationInput = z.infer<typeof createReservationSchema>

export const cancelReservationSchema = z.object({
  reservationId: uuid(),
  reason: z.string().max(300, 'Gerekçe en fazla 300 karakter olabilir').optional(),
})

export type CancelReservationInput = z.infer<typeof cancelReservationSchema>
