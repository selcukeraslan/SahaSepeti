import { cn } from '@/lib/utils'

export interface BarChartItem {
  label: string
  value: number
  highlight?: boolean
}

interface BarChartProps {
  items: BarChartItem[]
  /** Çubuk üstünde gösterilecek değer biçimi (varsayılan: sayı) */
  formatValue?: (value: number) => string
  className?: string
}

/** Bağımlılıksız, saf CSS dikey bar chart. */
export function BarChart({ items, formatValue, className }: BarChartProps) {
  const max = Math.max(1, ...items.map((item) => item.value))

  return (
    <div className={cn('flex items-end gap-2', className)}>
      {items.map((item, index) => {
        const pct = (item.value / max) * 100
        return (
          <div key={index} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600 dark:text-ink-300">
              {formatValue ? formatValue(item.value) : item.value}
            </span>
            <div className="flex h-32 w-full items-end">
              <div
                className={cn(
                  'w-full rounded-t-lg transition-[height]',
                  item.highlight
                    ? 'bg-primary-600'
                    : 'bg-primary-500/70 dark:bg-primary-500/40',
                )}
                style={{ height: `${item.value === 0 ? 2 : Math.max(pct, 4)}%` }}
                title={`${item.label}: ${item.value}`}
              />
            </div>
            <span className="w-full truncate text-center text-xs text-slate-500 dark:text-ink-400">
              {item.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
