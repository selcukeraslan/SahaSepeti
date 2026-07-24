/** get_venue_reviews RPC dönüşü — yorum + KVKK dostu maskeli yazar adı ("S. E") + owner yanıtı */
export interface VenueReview {
  id: string
  rating: number
  comment: string | null
  created_at: string
  reviewer_name: string
  owner_reply: string | null
  owner_reply_at: string | null
}

/** Bir tesisin puan özeti */
export interface RatingSummary {
  average: number
  count: number
}
