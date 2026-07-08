import { addDays, format, isSameDay, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toDateString } from '@/lib/format'
import { cn } from '@/lib/utils'

export interface DateStripProps {
  /** yyyy-MM-dd */
  selected: string
  onSelect: (date: string) => void
  /** Bugünden itibaren gösterilecek gün sayısı */
  days?: number
}

/** Yatay kaydırmalı tarih seçici — bugün + N gün. */
export function DateStrip({ selected, onSelect, days = 14 }: DateStripProps) {
  const today = new Date()
  const selectedDate = parseISO(selected)

  return (
    <div className="flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Tarih seçimi">
      {Array.from({ length: days }, (_, index) => {
        const date = addDays(today, index)
        const isSelected = isSameDay(date, selectedDate)
        return (
          <button
            key={index}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelect(toDateString(date))}
            className={cn(
              'flex min-w-16 shrink-0 flex-col items-center rounded-xl border px-3 py-2.5 transition-colors',
              isSelected
                ? 'border-primary-600 bg-primary-600 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:border-primary-300',
            )}
          >
            <span
              className={cn(
                'text-xs font-medium uppercase',
                isSelected ? 'text-primary-100' : 'text-slate-400',
              )}
            >
              {index === 0 ? 'Bugün' : format(date, 'EEE', { locale: tr })}
            </span>
            <span className="mt-0.5 text-lg font-bold leading-none">{format(date, 'd')}</span>
            <span
              className={cn(
                'mt-0.5 text-xs',
                isSelected ? 'text-primary-100' : 'text-slate-400',
              )}
            >
              {format(date, 'MMM', { locale: tr })}
            </span>
          </button>
        )
      })}
    </div>
  )
}
