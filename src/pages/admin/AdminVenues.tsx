import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Pause, Play } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { QueryErrorState } from '@/components/ui/QueryErrorState'
import { useToast } from '@/components/ui/useToast'
import { useAdminVenueMutations, useAdminVenues } from '@/features/admin/hooks/useAdmin'
import { VENUE_STATUS_LABELS, VENUE_STATUS_VARIANTS } from '@/features/dashboard/types'
import type { VenueStatus } from '@/types/database.types'

export function AdminVenues() {
  const [status, setStatus] = useState('')
  const { data: venues, isLoading, isError, isFetching, refetch } = useAdminVenues(
    (status || undefined) as VenueStatus | undefined,
  )
  const { approve, suspend } = useAdminVenueMutations()
  const { toast } = useToast()

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-ink-50">Tüm Tesisler</h1>

      <div className="mt-4 max-w-xs">
        <Select
          aria-label="Durum filtresi"
          placeholder="Tüm durumlar"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          options={Object.entries(VENUE_STATUS_LABELS).map(([value, label]) => ({
            value,
            label,
          }))}
        />
      </div>

      <div className="mt-5 space-y-3">
        {isLoading &&
          Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-24" />)}

        {isError && (
          <QueryErrorState
            title="Tesisler yüklenemedi"
            isRetrying={isFetching}
            onRetry={() => { void refetch() }}
          />
        )}

        {venues && venues.length === 0 && (
          <EmptyState
            title="Tesis bulunamadı"
            description="Bu durumda tesis yok."
            action={status ? (
              <Button variant="outline" size="sm" onClick={() => setStatus('')}>
                Tüm Durumları Göster
              </Button>
            ) : undefined}
          />
        )}

        {venues?.map((venue) => (
          <div
            key={venue.id}
            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:flex-row sm:items-center dark:border-ink-800 dark:bg-ink-900"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={VENUE_STATUS_VARIANTS[venue.status]}>
                  {VENUE_STATUS_LABELS[venue.status]}
                </Badge>
              </div>
              <p className="mt-1.5 font-semibold text-slate-900 dark:text-ink-50">{venue.name}</p>
              <p className="text-sm text-slate-500 dark:text-ink-400">
                {venue.district}, {venue.city} · Sahibi: {venue.owner?.full_name || '—'}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {venue.status === 'approved' && (
                <>
                  <Link to={`/tesis/${venue.slug}`} target="_blank">
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="size-4" aria-hidden />
                      Görüntüle
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    isLoading={suspend.isPending && suspend.variables === venue.id}
                    disabled={suspend.isPending || approve.isPending}
                    onClick={() =>
                      suspend.mutate(venue.id, {
                        onSuccess: () => toast('Tesis askıya alındı', 'success'),
                        onError: (error) => toast(error.message, 'error'),
                      })
                    }
                  >
                    <Pause className="size-4" aria-hidden />
                    Askıya Al
                  </Button>
                </>
              )}
              {venue.status === 'suspended' && (
                <Button
                  variant="outline"
                  size="sm"
                  isLoading={approve.isPending && approve.variables === venue.id}
                  disabled={suspend.isPending || approve.isPending}
                  onClick={() =>
                    approve.mutate(venue.id, {
                      onSuccess: () => toast('Tesis yeniden yayına alındı', 'success'),
                      onError: (error) => toast(error.message, 'error'),
                    })
                  }
                >
                  <Play className="size-4" aria-hidden />
                  Yayına Al
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
