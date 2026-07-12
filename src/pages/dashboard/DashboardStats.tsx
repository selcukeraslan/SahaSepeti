import { useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { BarChart3, CalendarCheck2, Clock, TrendingUp, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { BarChart, type BarChartItem } from '@/features/dashboard/components/BarChart'
import { useMyVenues, useOwnerStats } from '@/features/dashboard/hooks/useDashboard'
import {
  computeOwnerStats,
  STATS_RANGES,
  type BarDatum,
  type StatsRange,
} from '@/features/dashboard/services/stats'
import {
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_VARIANTS,
} from '@/features/reservations/types'
import type { ReservationStatus } from '@/types/database.types'
import { nowInIstanbul } from '@/features/venues/services/slots'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'

const STATUS_ORDER: ReservationStatus[] = ['pending', 'confirmed', 'completed', 'cancelled']

function compactTry(value: number): string {
  if (value >= 1_000_000) return `₺${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `₺${Math.round(value / 1000)}B`
  return `₺${value}`
}

/** En yüksek çubukları vurgular. */
function withHighlight(items: BarDatum[]): BarChartItem[] {
  const max = Math.max(0, ...items.map((item) => item.value))
  return items.map((item) => ({ ...item, highlight: max > 0 && item.value === max }))
}

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon
  label: string
  value: string
  hint?: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10">
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="truncate text-2xl font-bold leading-none text-slate-900 dark:text-ink-50">
            {value}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-ink-400">{label}</p>
          {hint && <p className="mt-0.5 text-xs text-slate-400 dark:text-ink-500">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

function ChartCard({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-ink-800 dark:bg-ink-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900 dark:text-ink-50">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  )
}

export function DashboardStats() {
  const [venueId, setVenueId] = useState('')
  const [range, setRange] = useState<StatsRange>('6m')
  const [metric, setMetric] = useState<'count' | 'revenue'>('revenue')
  const { data: venues } = useMyVenues()
  const { data: reservations, isLoading } = useOwnerStats(venueId || undefined)

  const today = useMemo(() => nowInIstanbul().date, [])
  const stats = useMemo(
    () => computeOwnerStats(reservations ?? [], today, range),
    [reservations, today, range],
  )

  const trendItems: BarChartItem[] = stats.trend.map((point, index) => ({
    label: point.label,
    value: metric === 'count' ? point.count : point.revenue,
    highlight: index === stats.trend.length - 1,
  }))

  const venueOptions = (venues ?? []).map((venue) => ({ value: venue.id, label: venue.name }))
  const rangeLabel = STATS_RANGES.find((option) => option.value === range)?.label ?? ''

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-ink-50">İstatistikler</h1>
        {venueOptions.length > 1 && (
          <div className="sm:w-56">
            <Select
              options={venueOptions}
              placeholder="Tüm tesisler"
              value={venueId}
              onChange={(event) => setVenueId(event.target.value)}
              aria-label="Tesise göre filtrele"
            />
          </div>
        )}
      </div>

      {/* Dönem filtresi */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-500 dark:text-ink-400">Dönem:</span>
        <div className="inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 p-0.5 dark:border-ink-700">
          {STATS_RANGES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRange(option.value)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                range === option.value
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-ink-300 dark:hover:bg-ink-800',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="mt-5 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      ) : stats.total === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={BarChart3}
            title="Bu dönemde veri yok"
            description="Seçili dönem için rezervasyon bulunmuyor. Başka bir dönem deneyin."
          />
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {/* KPI kartları */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard icon={BarChart3} label="Toplam Rezervasyon" value={String(stats.total)} />
            <KpiCard
              icon={TrendingUp}
              label="Tahmini Ciro"
              value={formatPrice(stats.revenue)}
              hint={rangeLabel}
            />
            <KpiCard
              icon={CalendarCheck2}
              label="Tamamlanan"
              value={String(stats.status.completed)}
            />
            <KpiCard
              icon={XCircle}
              label="İptal Oranı"
              value={`%${Math.round(stats.cancellationRate * 100)}`}
              hint={`${stats.status.cancelled} iptal`}
            />
          </div>

          {/* Ciro / rezervasyon trendi */}
          <ChartCard
            title={`Trend · ${rangeLabel}`}
            action={
              <div className="inline-flex rounded-xl border border-slate-200 p-0.5 dark:border-ink-700">
                {(['revenue', 'count'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setMetric(option)}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                      metric === option
                        ? 'bg-primary-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-ink-300 dark:hover:bg-ink-800',
                    )}
                  >
                    {option === 'revenue' ? 'Ciro' : 'Rezervasyon'}
                  </button>
                ))}
              </div>
            }
          >
            <BarChart
              items={trendItems}
              formatValue={metric === 'revenue' ? compactTry : undefined}
            />
          </ChartCard>

          {/* Durum kırılımı */}
          <ChartCard title="Duruma Göre">
            <div className="flex flex-wrap gap-3">
              {STATUS_ORDER.map((status) => (
                <div
                  key={status}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-200 px-3.5 py-2.5 dark:border-ink-800"
                >
                  <Badge variant={RESERVATION_STATUS_VARIANTS[status]}>
                    {RESERVATION_STATUS_LABELS[status]}
                  </Badge>
                  <span className="text-lg font-bold text-slate-900 dark:text-ink-50">
                    {stats.status[status]}
                  </span>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* Yoğunluk grafikleri */}
          <div className="grid gap-5 lg:grid-cols-2">
            <ChartCard title="En Yoğun Saatler">
              {stats.byHour.length > 0 ? (
                <>
                  <BarChart items={withHighlight(stats.byHour)} />
                  {stats.busiestHour && (
                    <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-500 dark:text-ink-400">
                      <Clock className="size-4 text-primary-600" aria-hidden />
                      En yoğun saat: <span className="font-semibold">{stats.busiestHour}</span>
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-500 dark:text-ink-400">Gösterilecek veri yok.</p>
              )}
            </ChartCard>

            <ChartCard title="Haftanın Günleri">
              <BarChart items={withHighlight(stats.byDay)} />
              {stats.busiestDay && (
                <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-500 dark:text-ink-400">
                  <CalendarCheck2 className="size-4 text-primary-600" aria-hidden />
                  En yoğun gün: <span className="font-semibold">{stats.busiestDay}</span>
                </p>
              )}
            </ChartCard>
          </div>
        </div>
      )}
    </div>
  )
}
