import { RatingStars } from '@/components/ui/RatingStars'
import { formatDateShort } from '@/lib/format'
import type { VenueReview } from '../types'

export function ReviewList({ reviews }: { reviews: VenueReview[] }) {
  return (
    <ul className="mt-4 space-y-3">
      {reviews.map((review) => (
        <li
          key={review.id}
          className="rounded-2xl border border-slate-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4 shadow-soft"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium text-slate-900 dark:text-ink-50">
              {review.reviewer_name}
            </span>
            <span className="shrink-0 text-xs text-slate-400 dark:text-ink-500">
              {formatDateShort(review.created_at.slice(0, 10))}
            </span>
          </div>
          <RatingStars value={review.rating} className="mt-1.5" />
          {review.comment && (
            <p className="mt-2 whitespace-pre-line text-sm text-slate-600 dark:text-ink-300">
              {review.comment}
            </p>
          )}
        </li>
      ))}
    </ul>
  )
}
