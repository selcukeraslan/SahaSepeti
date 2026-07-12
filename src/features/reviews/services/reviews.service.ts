import { supabase } from '@/lib/supabase'
import type { Review } from '@/types/database.types'
import { createReviewSchema, type CreateReviewInput } from '../schemas'
import type { RatingSummary, VenueReview } from '../types'

/** RLS ihlali: tamamlanmış rezervasyonu olmayan müşteri yorum yazamaz */
const RLS_VIOLATION = '42501'

export async function listVenueReviews(venueId: string): Promise<VenueReview[]> {
  const { data, error } = await supabase.rpc('get_venue_reviews', { p_venue_id: venueId })
  if (error) {
    throw new Error('Değerlendirmeler yüklenemedi')
  }
  return data ?? []
}

export async function upsertReview(input: CreateReviewInput): Promise<Review> {
  const data = createReviewSchema.parse(input)

  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) {
    throw new Error('Yorum yapmak için giriş yapmalısınız')
  }

  // Tesis başına tek yorum (unique venue_id+customer_id) → conflict'te günceller.
  const { data: review, error } = await supabase
    .from('reviews')
    .upsert(
      {
        venue_id: data.venueId,
        customer_id: auth.user.id,
        reservation_id: data.reservationId ?? null,
        rating: data.rating,
        comment: data.comment?.trim() || null,
      },
      { onConflict: 'venue_id,customer_id' },
    )
    .select()
    .single()

  if (error) {
    if (error.code === RLS_VIOLATION) {
      throw new Error('Yalnızca tamamlanmış rezervasyonu olduğunuz tesise yorum yapabilirsiniz.')
    }
    throw new Error(error.message || 'Değerlendirme kaydedilemedi')
  }
  return review
}

/** Yorum listesinden ortalama + adet (saf fonksiyon). */
export function summarizeReviews(reviews: VenueReview[]): RatingSummary {
  if (reviews.length === 0) return { average: 0, count: 0 }
  const total = reviews.reduce((sum, review) => sum + review.rating, 0)
  return { average: total / reviews.length, count: reviews.length }
}
