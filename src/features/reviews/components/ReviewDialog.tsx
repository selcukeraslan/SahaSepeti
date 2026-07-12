import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/useToast'
import { cn } from '@/lib/utils'
import { useUpsertReview } from '../hooks/useReviews'

interface ReviewDialogProps {
  open: boolean
  onClose: () => void
  venueId: string
  venueName: string
  reservationId?: string
}

const RATINGS = [1, 2, 3, 4, 5]

export function ReviewDialog({ open, onClose, venueId, venueName, reservationId }: ReviewDialogProps) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const upsert = useUpsertReview()
  const { toast } = useToast()

  // Dialog her açıldığında formu sıfırla
  useEffect(() => {
    if (open) {
      setRating(0)
      setHover(0)
      setComment('')
      setError(null)
    }
  }, [open])

  const handleSubmit = () => {
    if (rating < 1) {
      setError('Lütfen bir puan verin')
      return
    }
    upsert.mutate(
      { venueId, reservationId, rating, comment: comment.trim() || undefined },
      {
        onSuccess: () => {
          toast('Değerlendirmeniz kaydedildi, teşekkürler!', 'success')
          onClose()
        },
        onError: (err) => toast(err.message, 'error'),
      },
    )
  }

  const shown = hover || rating

  return (
    <Dialog open={open} onClose={onClose} title="Tesisi Değerlendir">
      <p className="text-sm text-slate-600 dark:text-ink-300">
        <span className="font-semibold text-slate-900 dark:text-ink-50">{venueName}</span>{' '}
        deneyiminizi puanlayın.
      </p>

      <div className="mt-4 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {RATINGS.map((value) => (
          <button
            key={value}
            type="button"
            aria-label={`${value} yıldız`}
            onClick={() => {
              setRating(value)
              setError(null)
            }}
            onMouseEnter={() => setHover(value)}
            className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            <Star
              className={cn(
                'size-8 transition-colors',
                value <= shown
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-slate-300 dark:text-ink-600',
              )}
              aria-hidden
            />
          </button>
        ))}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      <div className="mt-4">
        <Textarea
          label="Yorumunuz (isteğe bağlı)"
          placeholder="Deneyiminizi kısaca paylaşın..."
          maxLength={500}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
        />
      </div>

      <div className="mt-5 flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Vazgeç
        </Button>
        <Button className="flex-1" isLoading={upsert.isPending} onClick={handleSubmit}>
          Gönder
        </Button>
      </div>
    </Dialog>
  )
}
