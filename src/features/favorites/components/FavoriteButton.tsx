import type { MouseEvent } from 'react'
import { Heart } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useToast } from '@/components/ui/useToast'
import { cn } from '@/lib/utils'
import { useFavoriteIds, useToggleFavorite } from '../hooks/useFavorites'

interface FavoriteButtonProps {
  venueId: string
  /** 'overlay' → kart görseli üzerinde; 'plain' → detay başlığı yanında */
  variant?: 'overlay' | 'plain'
  className?: string
}

export function FavoriteButton({ venueId, variant = 'overlay', className }: FavoriteButtonProps) {
  const { profile } = useAuth()
  const { data: favoriteIds } = useFavoriteIds()
  const toggle = useToggleFavorite()
  const { toast } = useToast()

  // Favoriler yalnızca müşteriler içindir
  if (profile?.role !== 'customer') return null

  const isFavorite = favoriteIds?.includes(venueId) ?? false

  const handleClick = (event: MouseEvent) => {
    // Kart bir <Link> içinde olabilir; navigasyonu engelle
    event.preventDefault()
    event.stopPropagation()
    toggle.mutate(
      { venueId, isFavorite },
      {
        onSuccess: () =>
          toast(isFavorite ? 'Favorilerden çıkarıldı' : 'Favorilere eklendi', 'success'),
        onError: (err) => toast(err.message, 'error'),
      },
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={toggle.isPending}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
      title={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
      className={cn(
        'inline-flex items-center justify-center rounded-full transition-colors disabled:opacity-60',
        variant === 'overlay'
          ? 'size-9 bg-white/95 text-slate-600 shadow-soft hover:text-red-500 dark:bg-ink-900/95 dark:text-ink-300'
          : 'size-11 border border-slate-200 bg-white text-slate-600 hover:text-red-500 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300',
        className,
      )}
    >
      <Heart
        className={cn('size-5 transition-colors', isFavorite && 'fill-red-500 text-red-500')}
        aria-hidden
      />
    </button>
  )
}
