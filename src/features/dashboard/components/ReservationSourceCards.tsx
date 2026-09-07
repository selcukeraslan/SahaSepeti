import { Globe, Phone, Store } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { RESERVATION_SOURCE_LABELS } from '@/features/reservations/types'
import { formatPrice } from '@/lib/format'
import type { OwnerStats } from '../services/stats'

const SOURCES = [
  { source: 'marketplace', icon: Store },
  { source: 'manual', icon: Phone },
  { source: 'external', icon: Globe },
] as const

export function ReservationSourceCards({ bySource }: { bySource: OwnerStats['bySource'] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {SOURCES.map(({ source, icon: Icon }) => (
        <Card key={source}>
          <CardContent>
            <div className="flex items-center gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10">
                <Icon className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-2xl font-bold leading-none tabular-nums text-slate-900 dark:text-ink-50">
                  {bySource[source].count}
                  <span className="sr-only"> rezervasyon</span>
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-ink-400">
                  {RESERVATION_SOURCE_LABELS[source]}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-slate-100 pt-3 dark:border-ink-800">
              <span className="text-xs text-slate-500 dark:text-ink-400">Tahmini ciro</span>
              <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-ink-50">
                {formatPrice(bySource[source].revenue)}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
