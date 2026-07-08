import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'

const currencyFormatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/** 1500 → "₺1.500" */
export function formatPrice(amount: number): string {
  return currencyFormatter.format(amount)
}

/** "2026-07-08" → "8 Temmuz 2026, Çarşamba" */
export function formatDateLong(dateString: string): string {
  return format(parseISO(dateString), 'd MMMM yyyy, EEEE', { locale: tr })
}

/** "2026-07-08" → "8 Tem 2026" */
export function formatDateShort(dateString: string): string {
  return format(parseISO(dateString), 'd MMM yyyy', { locale: tr })
}

/** "20:00:00" veya "20:00" → "20:00" */
export function formatTime(timeString: string): string {
  return timeString.slice(0, 5)
}

/** Date → "2026-07-08" (yerel saat, UTC kayması yok) */
export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}
