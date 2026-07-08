import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { TimeSlot } from '../services/slots'

export interface SlotGridProps {
  slots: TimeSlot[]
  onSelect: (slot: TimeSlot) => void
}

/** Bir sahanın günlük slot ızgarası. */
export function SlotGrid({ slots, onSelect }: SlotGridProps) {
  if (slots.length === 0) {
    return (
      <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
        Bu tarihte tesis kapalı.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
      {slots.map((slot) => {
        const isAvailable = slot.status === 'available'
        return (
          <button
            key={slot.startTime}
            type="button"
            disabled={!isAvailable}
            onClick={() => onSelect(slot)}
            aria-label={`${slot.startTime} - ${slot.endTime}${isAvailable ? '' : ' (dolu)'}`}
            className={cn(
              'flex flex-col items-center rounded-xl border px-2 py-2.5 transition-colors',
              isAvailable &&
                'border-primary-200 bg-primary-50/50 hover:border-primary-500 hover:bg-primary-50',
              slot.status === 'booked' && 'cursor-not-allowed border-slate-200 bg-slate-100 opacity-60',
              (slot.status === 'past' || slot.status === 'unpriced') &&
                'cursor-not-allowed border-slate-100 bg-slate-50 opacity-40',
            )}
          >
            <span
              className={cn(
                'text-sm font-semibold',
                isAvailable ? 'text-slate-900' : 'text-slate-400',
              )}
            >
              {slot.startTime}
            </span>
            <span className="mt-0.5 text-xs text-slate-500">
              {slot.status === 'booked' && 'Dolu'}
              {slot.status === 'past' && 'Geçti'}
              {slot.status === 'unpriced' && '—'}
              {isAvailable && slot.price !== null && formatPrice(slot.price)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
