import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingStarsProps {
  /** 0-5 arası; ondalık değerler kısmi doldurma ile gösterilir */
  value: number
  size?: 'sm' | 'md'
  className?: string
}

const STARS = [0, 1, 2, 3, 4]

/** Salt-okunur yıldız gösterimi (kısmi doldurma destekli). */
export function RatingStars({ value, size = 'sm', className }: RatingStarsProps) {
  const pct = (Math.max(0, Math.min(5, value)) / 5) * 100
  const starClass = size === 'md' ? 'size-5' : 'size-4'

  return (
    <span
      className={cn('relative inline-flex w-fit', className)}
      role="img"
      aria-label={`5 üzerinden ${value.toFixed(1)} yıldız`}
    >
      <span className="flex text-slate-300 dark:text-ink-600">
        {STARS.map((i) => (
          <Star key={i} className={cn(starClass, 'shrink-0')} aria-hidden />
        ))}
      </span>
      <span
        className="absolute inset-y-0 left-0 flex overflow-hidden text-amber-400"
        style={{ width: `${pct}%` }}
      >
        {STARS.map((i) => (
          <Star key={i} className={cn(starClass, 'shrink-0 fill-current')} aria-hidden />
        ))}
      </span>
    </span>
  )
}
