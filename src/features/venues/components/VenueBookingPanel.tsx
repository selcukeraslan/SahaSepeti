import { EmptyState } from '@/components/ui/EmptyState'
import { QueryErrorState } from '@/components/ui/QueryErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import type { CourtWithPrices } from '../types'
import type { TimeSlot } from '../services/slots'
import { DateStrip } from './DateStrip'
import { SlotGrid } from './SlotGrid'

interface VenueBookingPanelProps {
  courts: CourtWithPrices[]
  activeCourt: CourtWithPrices | undefined
  activeSlots: TimeSlot[]
  date: string
  slotsLoading: boolean
  slotsError: boolean
  retrying: boolean
  onDateChange: (date: string) => void
  onCourtChange: (courtId: string) => void
  onSlotSelect: (slot: TimeSlot) => void
  onRetry: () => void
}

export function VenueBookingPanel({
  courts,
  activeCourt,
  activeSlots,
  date,
  slotsLoading,
  slotsError,
  retrying,
  onDateChange,
  onCourtChange,
  onSlotSelect,
  onRetry,
}: VenueBookingPanelProps) {
  return (
    <div className="sticky top-24 rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.5)] dark:border-ink-700 dark:bg-ink-900 sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-400">Rezervasyon</p>
      <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-slate-900 dark:text-ink-50">Müsait saatler</h2>
      <div className="mt-4"><DateStrip selected={date} onSelect={onDateChange} /></div>

      {courts.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="Henüz saha eklenmemiş" description="Bu tesis henüz rezervasyona açık saha tanımlamamış." />
        </div>
      ) : (
        <>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Saha seçimi">
            {courts.map((court) => {
              const isActive = court.id === activeCourt?.id
              return (
                <button
                  key={court.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onCourtChange(court.id)}
                  className={cn(
                    'shrink-0 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'border-primary-600 bg-primary-600 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-primary-300 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-300',
                  )}
                >
                  {court.name}
                  {court.is_indoor && (
                    <span className={cn('ml-1.5 text-xs', isActive ? 'text-primary-100' : 'text-slate-400 dark:text-ink-500')}>(Kapalı)</span>
                  )}
                </button>
              )
            })}
          </div>
          <div className="mt-4">
            {slotsLoading ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {Array.from({ length: 10 }, (_, index) => <Skeleton key={index} className="h-14" />)}
              </div>
            ) : slotsError ? (
              <QueryErrorState
                title="Saatler yüklenemedi"
                description="Müsait saatleri yeniden yüklemeyi deneyin."
                isRetrying={retrying}
                onRetry={onRetry}
              />
            ) : (
              <SlotGrid slots={activeSlots} onSelect={onSlotSelect} />
            )}
          </div>
        </>
      )}
    </div>
  )
}
