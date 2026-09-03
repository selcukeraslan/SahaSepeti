import { ReviewList } from '@/features/reviews/components/ReviewList'
import { QueryErrorState } from '@/components/ui/QueryErrorState'
import type { RatingSummary, VenueReview } from '@/features/reviews/types'

interface VenueReviewsProps {
  reviews: VenueReview[]
  rating: RatingSummary
  isError: boolean
  isRetrying: boolean
  onRetry: () => void
}

export function VenueReviews({ reviews, rating, isError, isRetrying, onRetry }: VenueReviewsProps) {
  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-ink-50">
        Değerlendirmeler
        {rating.count > 0 && (
          <span className="ml-1.5 text-base font-normal text-slate-400 dark:text-ink-500">({rating.count})</span>
        )}
      </h2>
      {isError ? (
        <div className="mt-3">
          <QueryErrorState
            title="Değerlendirmeler yüklenemedi"
            description="Değerlendirmeleri yeniden yüklemeyi deneyin."
            isRetrying={isRetrying}
            onRetry={onRetry}
          />
        </div>
      ) : reviews.length > 0 ? (
        <ReviewList reviews={reviews} />
      ) : (
        <p className="mt-2 text-sm text-slate-500 dark:text-ink-400">Bu tesis için henüz değerlendirme yapılmamış.</p>
      )}
    </div>
  )
}
