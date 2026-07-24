import { Fragment } from 'react'
import { cn } from '@/lib/utils'
import type { OccupancyHeatmap } from '@/features/dashboard/services/stats'

const DAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

/** Yoğunluğa göre hücre rengi (marka zümrüt tonlarında). */
function cellClass(value: number, max: number): string {
  if (value === 0) return 'bg-slate-100 text-transparent dark:bg-ink-800'
  const t = max > 0 ? value / max : 0
  if (t > 0.75) return 'bg-primary-600 text-white'
  if (t > 0.5) return 'bg-primary-500 text-white'
  if (t > 0.25) return 'bg-primary-400 text-white'
  return 'bg-primary-200 text-primary-900 dark:bg-primary-500/30 dark:text-primary-100'
}

/** Gün × saat doluluk ısı haritası. */
export function OccupancyHeatmapView({ heatmap }: { heatmap: OccupancyHeatmap }) {
  if (heatmap.hours.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-ink-400">Gösterilecek veri yok.</p>
  }

  return (
    <div className="overflow-x-auto">
      <div
        className="inline-grid gap-1"
        style={{ gridTemplateColumns: `auto repeat(${heatmap.hours.length}, minmax(1.4rem, 1fr))` }}
      >
        {/* Başlık satırı: saatler */}
        <div />
        {heatmap.hours.map((hour) => (
          <div key={hour} className="text-center text-[10px] text-slate-400 dark:text-ink-500">
            {String(hour).padStart(2, '0')}
          </div>
        ))}

        {/* Gün satırları */}
        {DAY_LABELS.map((day, dayIndex) => (
          <Fragment key={day}>
            <div className="self-center pr-2 text-right text-xs font-medium text-slate-500 dark:text-ink-400">
              {day}
            </div>
            {(heatmap.grid[dayIndex] ?? []).map((value, hourIndex) => (
              <div
                key={hourIndex}
                title={`${day} ${String(heatmap.hours[hourIndex] ?? 0).padStart(2, '0')}:00 — ${value} rezervasyon`}
                className={cn(
                  'flex h-6 items-center justify-center rounded text-[10px] font-semibold',
                  cellClass(value, heatmap.max),
                )}
              >
                {value > 0 ? value : ''}
              </div>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
