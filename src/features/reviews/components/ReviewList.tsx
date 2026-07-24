import { useState } from 'react'
import { MessageSquareReply } from 'lucide-react'
import { RatingStars } from '@/components/ui/RatingStars'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/useToast'
import { formatDateShort } from '@/lib/format'
import { useSetReviewReply } from '../hooks/useReviews'
import type { VenueReview } from '../types'

interface ReviewListProps {
  reviews: VenueReview[]
  /** Görüntüleyen bu tesisin sahibi mi (yanıt yazabilir) */
  canReply?: boolean
  /** Yanıt sonrası cache tazelemesi için */
  venueId?: string
}

function ReviewItem({
  review,
  canReply,
  venueId,
}: {
  review: VenueReview
  canReply: boolean
  venueId: string
}) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(review.owner_reply ?? '')
  const setReply = useSetReviewReply(venueId)
  const { toast } = useToast()

  const submit = () => {
    setReply.mutate(
      { reviewId: review.id, reply: text },
      {
        onSuccess: () => {
          toast(text.trim() ? 'Yanıtınız kaydedildi' : 'Yanıt kaldırıldı', 'success')
          setEditing(false)
        },
        onError: (error) => toast(error.message, 'error'),
      },
    )
  }

  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-ink-800 dark:bg-ink-900">
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium text-slate-900 dark:text-ink-50">{review.reviewer_name}</span>
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

      {/* Tesis sahibi yanıtı (herkese görünür) */}
      {review.owner_reply && !editing && (
        <div className="mt-3 rounded-xl border-l-2 border-primary-500 bg-primary-50 px-3 py-2 dark:bg-primary-500/10">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-primary-700 dark:text-primary-300">
            <MessageSquareReply className="size-3.5" aria-hidden />
            Tesisin yanıtı
          </p>
          <p className="mt-1 whitespace-pre-line text-sm text-slate-700 dark:text-ink-200">
            {review.owner_reply}
          </p>
        </div>
      )}

      {/* Owner yanıt editörü */}
      {canReply && !editing && (
        <button
          type="button"
          onClick={() => {
            setText(review.owner_reply ?? '')
            setEditing(true)
          }}
          className="mt-2 flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          <MessageSquareReply className="size-4" aria-hidden />
          {review.owner_reply ? 'Yanıtı düzenle' : 'Yanıtla'}
        </button>
      )}

      {canReply && editing && (
        <div className="mt-3">
          <Textarea
            label="Tesis yanıtı"
            placeholder="Değerli yorumunuz için teşekkürler..."
            maxLength={500}
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" isLoading={setReply.isPending} onClick={submit}>
              Kaydet
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
              Vazgeç
            </Button>
            {review.owner_reply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setText('')
                  setReply.mutate(
                    { reviewId: review.id, reply: '' },
                    {
                      onSuccess: () => {
                        toast('Yanıt kaldırıldı', 'success')
                        setEditing(false)
                      },
                      onError: (error) => toast(error.message, 'error'),
                    },
                  )
                }}
              >
                Yanıtı sil
              </Button>
            )}
          </div>
        </div>
      )}
    </li>
  )
}

export function ReviewList({ reviews, canReply = false, venueId = '' }: ReviewListProps) {
  return (
    <ul className="mt-4 space-y-3">
      {reviews.map((review) => (
        <ReviewItem key={review.id} review={review} canReply={canReply} venueId={venueId} />
      ))}
    </ul>
  )
}
