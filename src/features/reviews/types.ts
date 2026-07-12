/** get_venue_reviews RPC dönüşü — yorum + KVKK dostu maskeli yazar adı ("Selçuk E.") */
export interface VenueReview {
  id: string
  rating: number
  comment: string | null
  created_at: string
  reviewer_name: string
}

/** Bir tesisin puan özeti */
export interface RatingSummary {
  average: number
  count: number
}
