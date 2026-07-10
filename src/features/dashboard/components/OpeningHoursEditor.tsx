import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/useToast'
import { formatTime } from '@/lib/format'
import { useOpeningHours, useSaveOpeningHours } from '../hooks/useDashboard'
import type { OpeningHourInput } from '../schemas'
import { DAY_NAMES_TR, WEEK_DAY_ORDER } from '../types'

const DEFAULT_HOURS: OpeningHourInput[] = Array.from({ length: 7 }, (_, day) => ({
  dayOfWeek: day,
  openTime: '09:00',
  closeTime: '23:00',
  isClosed: false,
}))

export function OpeningHoursEditor({ venueId }: { venueId: string }) {
  const { data: saved, isLoading } = useOpeningHours(venueId)
  const saveHours = useSaveOpeningHours(venueId)
  const { toast } = useToast()
  const [hours, setHours] = useState<OpeningHourInput[]>(DEFAULT_HOURS)

  useEffect(() => {
    if (!saved || saved.length === 0) return
    setHours(
      DEFAULT_HOURS.map((defaults) => {
        const row = saved.find((item) => item.day_of_week === defaults.dayOfWeek)
        return row
          ? {
              dayOfWeek: row.day_of_week,
              openTime: formatTime(row.open_time),
              closeTime: formatTime(row.close_time),
              isClosed: row.is_closed,
            }
          : defaults
      }),
    )
  }, [saved])

  const updateDay = (day: number, patch: Partial<OpeningHourInput>) => {
    setHours((current) =>
      current.map((hour) => (hour.dayOfWeek === day ? { ...hour, ...patch } : hour)),
    )
  }

  const handleSave = () => {
    const invalid = hours.find((hour) => !hour.isClosed && hour.openTime >= hour.closeTime)
    if (invalid) {
      toast(
        `${DAY_NAMES_TR[invalid.dayOfWeek]}: kapanış saati açılıştan sonra olmalı`,
        'error',
      )
      return
    }
    saveHours.mutate(hours, {
      onSuccess: () => toast('Çalışma saatleri kaydedildi', 'success'),
      onError: (error) => toast(error.message, 'error'),
    })
  }

  if (isLoading) {
    return <Skeleton className="h-80" />
  }

  return (
    <div>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Tesisinizin haftalık çalışma saatlerini belirleyin. Rezervasyon slotları bu saatlere göre
        oluşturulur.
      </p>
      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        {WEEK_DAY_ORDER.map((day) => {
          const hour = hours.find((item) => item.dayOfWeek === day)
          if (!hour) return null
          return (
            <div
              key={day}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-4 py-3 last:border-0"
            >
              <label className="flex min-w-32 items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={!hour.isClosed}
                  onChange={(event) => updateDay(day, { isClosed: !event.target.checked })}
                  className="size-4 rounded border-slate-300 dark:border-slate-700 accent-primary-600"
                />
                {DAY_NAMES_TR[day]}
              </label>
              {hour.isClosed ? (
                <span className="text-sm text-slate-400 dark:text-slate-500">Kapalı</span>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    aria-label={`${DAY_NAMES_TR[day]} açılış`}
                    value={hour.openTime}
                    onChange={(event) => updateDay(day, { openTime: event.target.value })}
                    className="h-10 rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 text-sm"
                  />
                  <span className="text-slate-400 dark:text-slate-500">–</span>
                  <input
                    type="time"
                    aria-label={`${DAY_NAMES_TR[day]} kapanış`}
                    value={hour.closeTime}
                    onChange={(event) => updateDay(day, { closeTime: event.target.value })}
                    className="h-10 rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 text-sm"
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={handleSave} isLoading={saveHours.isPending}>
          Kaydet
        </Button>
      </div>
    </div>
  )
}
