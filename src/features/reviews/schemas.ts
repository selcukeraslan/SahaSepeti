import { z } from 'zod'
import { uuid } from '@/lib/validation'

export const createReviewSchema = z.object({
  venueId: uuid('Geçersiz tesis'),
  reservationId: uuid('Geçersiz rezervasyon').optional(),
  rating: z
    .number()
    .int()
    .min(1, 'Lütfen 1-5 arası puan verin')
    .max(5, 'Lütfen 1-5 arası puan verin'),
  comment: z.string().max(500, 'Yorum en fazla 500 karakter olabilir').optional(),
})

export type CreateReviewInput = z.infer<typeof createReviewSchema>
