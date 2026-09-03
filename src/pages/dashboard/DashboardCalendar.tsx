import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { addDays, format, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { QueryErrorState } from '@/components/ui/QueryErrorState'
import { CalendarSlotDialog } from '@/features/dashboard/components/CalendarSlotDialog'
import { useMyVenues, useOwnerDaySchedule } from '@/features/dashboard/hooks/useDashboard'
import type { ScheduleSlot } from '@/features/dashboard/types'
import { nowInIstanbul } from '@/features/venues/services/slots'
import { formatDateLong, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'

interface ActiveSlot {
  courtId: string
  courtName: string
  slot: ScheduleSlot
}

const CHIP_BASE = 'rounded-lg px-2 py-1.5 text-center text-xs font-medium leading-tight transition-colors'

function SlotChip({ slot, onOpen }: { slot: ScheduleSlot; onOpen: () => void }) {
  const time = formatTime(slot.startTime)

  if (slot.status === 'available') {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          CHIP_BASE,
          'border border-dashed border-primary-400 text-primary-700 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-500/10',
        )}
      >
        {time}
        <span className="block text-[10px] font-normal opacity-70">boş</span>
      </button>
    )
  }

  if (slot.status === 'booked') {
    const noShow = slot.reservation?.noShow
    return (
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          CHIP_BASE,
          noShow
            ? 'bg-amber-500 text-white hover:bg-amber-600'
            : 'bg-primary-600 text-white hover:bg-primary-700',
        )}
      >
        {time}
        <span className="block truncate text-[10px] font-normal opacity-90">
          {slot.reservation?.customerName}
        </span>
      </button>
    )
  }

  if (slot.status === 'blocked') {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={cn(CHIP_BASE, 'bg-slate-400 text-white hover:bg-slate-500 dark:bg-ink-600 dark:hover:bg-ink-500')}
      >
        {time}
        <span className="block text-[10px] font-normal opacity-90">Bakım</span>
      </button>
    )
  }

  // past / unpriced — tıklanamaz
  return (
    <div
      className={cn(
        CHIP_BASE,
        'cursor-default border border-slate-100 text-slate-300 dark:border-ink-800 dark:text-ink-600',
      )}
    >
      {time}
      <span className="block text-[10px] font-normal">
        {slot.status === 'unpriced' ? 'fiyat yok' : 'geçti'}
      </span>
    </div>
  )
}

export function DashboardCalendar() {
  const {
    data: venues,
    isLoading: venuesLoading,
    isError: venuesError,
    isFetching: venuesFetching,
    refetch: refetchVenues,
  } = useMyVenues()
  const [venueId, setVenueId] = useState('')
  const [date, setDate] = useState(() => nowInIstanbul().date)
  const [active, setActive] = useState<ActiveSlot | null>(null)

  // İlk tesisi otomatik seç
  useEffect(() => {
    if (!venueId && venues && venues[0]) setVenueId(venues[0].id)
  }, [venues, venueId])

  const {
    data: schedule,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useOwnerDaySchedule(venueId || undefined, date)

  const shiftDay = (delta: number) =>
    setDate((current) => format(addDays(parseISO(current), delta), 'yyyy-MM-dd'))

  const openSlot = (courtId: string, courtName: string, slot: ScheduleSlot) => {
    // Yalnızca boş veya dolu (rezervasyon/blok) slotlar açılır; geçmiş/fiyatsız değil
    if (slot.status === 'available' || slot.reservation) {
      setActive({ courtId, courtName, slot })
    }
  }

  if (venuesLoading) {
    return <Skeleton className="h-96" />
  }

  if (venuesError) {
    return (
      <QueryErrorState
        title="Tesisler yüklenemedi"
        isRetrying={venuesFetching}
        onRetry={() => { void refetchVenues() }}
      />
    )
  }

  if (venues && venues.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-ink-50">Takvim</h1>
        <div className="mt-6">
          <EmptyState
            title="Önce bir tesis ekleyin"
            description="Takvimi kullanmak için en az bir tesisiniz olmalı."
            action={
              <Link to="/panel/tesisler/yeni">
                <Button>Tesis Ekle</Button>
              </Link>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-ink-50">Takvim</h1>
        {(venues?.length ?? 0) > 1 && (
          <div className="sm:w-60">
            <Select
              aria-label="Tesis seç"
              value={venueId}
              onChange={(event) => setVenueId(event.target.value)}
              options={(venues ?? []).map((venue) => ({ value: venue.id, label: venue.name }))}
            />
          </div>
        )}
      </div>

      {/* Gün gezinme */}
      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-soft dark:border-ink-800 dark:bg-ink-900">
        <Button variant="ghost" size="sm" onClick={() => shiftDay(-1)} aria-label="Önceki gün">
          <ChevronLeft className="size-5" aria-hidden />
        </Button>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-900 dark:text-ink-50">
            {formatDateLong(date)}
          </p>
          {date !== nowInIstanbul().date && (
            <button
              type="button"
              onClick={() => setDate(nowInIstanbul().date)}
              className="text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              Bugüne dön
            </button>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => shiftDay(1)} aria-label="Sonraki gün">
          <ChevronRight className="size-5" aria-hidden />
        </Button>
      </div>

      {/* Açıklama (renk anahtarı) */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-ink-400">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded border border-dashed border-primary-400" /> Boş (tıkla → ekle)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-primary-600" /> Dolu
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-amber-500" /> No-show
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-slate-400 dark:bg-ink-600" /> Bakım/Blok
        </span>
      </div>

      {/* Sahalar */}
      <div className="mt-5 space-y-4">
        {isLoading &&
          Array.from({ length: 2 }, (_, index) => <Skeleton key={index} className="h-40" />)}

        {isError && (
          <QueryErrorState
            title="Takvim yüklenemedi"
            isRetrying={isFetching}
            onRetry={() => { void refetch() }}
          />
        )}

        {schedule && schedule.length === 0 && (
          <EmptyState
            title="Aktif saha yok"
            description="Bu tesiste rezervasyona açık saha bulunmuyor. Tesis panelinden saha ekleyin."
            action={
              <Link to={`/panel/tesisler/${venueId}`}>
                <Button variant="outline">Tesisi Yönet</Button>
              </Link>
            }
          />
        )}

        {schedule?.map((court) => (
          <div
            key={court.courtId}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-ink-800 dark:bg-ink-900"
          >
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-slate-900 dark:text-ink-50">{court.courtName}</h2>
              {court.isIndoor && (
                <span className="text-xs text-slate-400 dark:text-ink-500">(Kapalı saha)</span>
              )}
            </div>

            {court.isClosedToday ? (
              <p className="mt-3 text-sm text-slate-400 dark:text-ink-500">Bu gün kapalı.</p>
            ) : court.slots.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400 dark:text-ink-500">Tanımlı slot yok.</p>
            ) : (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {court.slots.map((slot) => (
                  <SlotChip
                    key={slot.startTime}
                    slot={slot}
                    onOpen={() => openSlot(court.courtId, court.courtName, slot)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {active && (
        <CalendarSlotDialog
          open={active !== null}
          onClose={() => setActive(null)}
          venueId={venueId}
          courtId={active.courtId}
          courtName={active.courtName}
          date={date}
          slot={active.slot}
        />
      )}
    </div>
  )
}
