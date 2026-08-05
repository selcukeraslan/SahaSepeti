import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { tr } from 'date-fns/locale'
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { toDateString } from '@/lib/format'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa']

export interface DatePickerProps {
  /** yyyy-MM-dd */
  value?: string
  /** yyyy-MM-dd */
  min?: string
  label?: string
  placeholder?: string
  className?: string
  onChange: (value: string) => void
}

/** Büyük, mobil uyumlu ve tarayıcıdan bağımsız tarih seçici. */
export function DatePicker({
  value,
  min,
  label,
  placeholder = 'Tarih seçin',
  className,
  onChange,
}: DatePickerProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const initialDate = value ? parseISO(value) : min ? parseISO(min) : new Date()
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(initialDate))
  const selectedDate = value ? parseISO(value) : null
  const minDate = min ? parseISO(min) : null

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  const openCalendar = () => {
    const focusDate = selectedDate ?? minDate ?? new Date()
    setVisibleMonth(startOfMonth(focusDate))
    setOpen(true)
  }

  const calendarStart = startOfWeek(startOfMonth(visibleMonth), { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(endOfMonth(visibleMonth), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const previousMonth = subMonths(visibleMonth, 1)
  const previousDisabled = minDate ? isBefore(endOfMonth(previousMonth), minDate) : false

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-ink-200">
          {label}
        </label>
      )}
      <button
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={openCalendar}
        className={cn(
          'flex h-12 w-full items-center gap-3 rounded-xl border border-slate-300 bg-white px-3.5 text-left transition-all',
          'hover:border-primary-400 hover:bg-primary-50/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600',
          'dark:border-ink-700 dark:bg-ink-900 dark:hover:border-primary-500 dark:hover:bg-primary-500/5',
          className,
        )}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-300">
          <CalendarDays className="size-4.5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              'block truncate text-sm font-medium',
              selectedDate ? 'text-slate-900 dark:text-ink-50' : 'text-slate-500 dark:text-ink-400',
            )}
          >
            {selectedDate
              ? format(selectedDate, 'd MMM yyyy', { locale: tr })
              : placeholder}
          </span>
          {selectedDate && (
            <span className="block truncate text-xs capitalize text-slate-400 dark:text-ink-500">
              {format(selectedDate, 'EEEE', { locale: tr })}
            </span>
          )}
        </span>
        <ChevronRight className="size-4 shrink-0 text-slate-400 dark:text-ink-500" aria-hidden />
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[70] flex items-end justify-center bg-ink-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-6"
            role="presentation"
            onClick={() => setOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${id}-title`}
              onClick={(event) => event.stopPropagation()}
              className="w-full rounded-t-3xl bg-white p-4 shadow-2xl dark:bg-ink-900 sm:max-w-sm sm:rounded-3xl sm:p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                    Rezervasyon tarihi
                  </p>
                  <h2 id={`${id}-title`} className="mt-0.5 text-lg font-bold text-slate-900 dark:text-ink-50">
                    Tarihini seç
                  </h2>
                </div>
                <button
                  type="button"
                  aria-label="Takvimi kapat"
                  onClick={() => setOpen(false)}
                  className="flex size-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-ink-500 dark:hover:bg-ink-800 dark:hover:text-ink-200"
                >
                  <X className="size-5" aria-hidden />
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 p-1.5 dark:bg-ink-800">
                <button
                  type="button"
                  aria-label="Önceki ay"
                  disabled={previousDisabled}
                  onClick={() => setVisibleMonth(previousMonth)}
                  className="flex size-9 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-30 dark:text-ink-300 dark:hover:bg-ink-700"
                >
                  <ChevronLeft className="size-5" aria-hidden />
                </button>
                <p className="font-semibold capitalize text-slate-900 dark:text-ink-50">
                  {format(visibleMonth, 'MMMM yyyy', { locale: tr })}
                </p>
                <button
                  type="button"
                  aria-label="Sonraki ay"
                  onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}
                  className="flex size-9 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-white dark:text-ink-300 dark:hover:bg-ink-700"
                >
                  <ChevronRight className="size-5" aria-hidden />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-7 gap-0.5" aria-hidden>
                {WEEKDAYS.map((day) => (
                  <span
                    key={day}
                    className="flex h-7 items-center justify-center text-xs font-semibold text-slate-400 dark:text-ink-500"
                  >
                    {day}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {days.map((day) => {
                  const disabled = minDate ? isBefore(day, minDate) : false
                  const selected = selectedDate ? isSameDay(day, selectedDate) : false
                  const inMonth = isSameMonth(day, visibleMonth)
                  return (
                    <button
                      key={toDateString(day)}
                      type="button"
                      disabled={disabled}
                      aria-label={format(day, 'd MMMM yyyy, EEEE', { locale: tr })}
                      aria-pressed={selected}
                      onClick={() => {
                        onChange(toDateString(day))
                        setOpen(false)
                      }}
                      className={cn(
                        'flex aspect-square items-center justify-center rounded-lg text-sm font-medium transition-colors',
                        selected
                          ? 'bg-primary-600 text-white shadow-soft'
                          : 'text-slate-700 hover:bg-primary-50 hover:text-primary-700 dark:text-ink-200 dark:hover:bg-primary-500/10 dark:hover:text-primary-300',
                        !inMonth && !selected && 'text-slate-300 dark:text-ink-600',
                        disabled && 'cursor-not-allowed text-slate-200 hover:bg-transparent hover:text-slate-200 dark:text-ink-700 dark:hover:bg-transparent dark:hover:text-ink-700',
                      )}
                    >
                      {format(day, 'd')}
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-ink-800">
                <button
                  type="button"
                  onClick={() => {
                    onChange('')
                    setOpen(false)
                  }}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-100"
                >
                  Temizle
                </button>
                {minDate && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange(toDateString(minDate))
                      setOpen(false)
                    }}
                    className="rounded-xl bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-100 dark:bg-primary-500/10 dark:text-primary-300 dark:hover:bg-primary-500/20"
                  >
                    Bugünü seç
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
