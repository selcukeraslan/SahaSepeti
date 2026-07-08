import { SLOT_DURATION_HOURS } from '@/config/sports'
import type { OpeningHour, PriceRule } from '@/types/database.types'

/**
 * Saf slot üretim mantığı — Supabase'e bağımlı DEĞİLDİR, birim testlenebilir.
 * Veri erişimi için bkz. availability.service.ts
 */

export type SlotStatus = 'available' | 'booked' | 'past' | 'unpriced'

export interface TimeSlot {
  /** "HH:mm" */
  startTime: string
  /** "HH:mm" */
  endTime: string
  price: number | null
  status: SlotStatus
}

export interface BookedRange {
  court_id: string
  /** "HH:mm:ss" veya "HH:mm" */
  start_time: string
  /** "HH:mm:ss" veya "HH:mm" */
  end_time: string
}

export function timeToMinutes(time: string): number {
  const [hours = 0, minutes = 0] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd
}

/**
 * Fiyat kuralı eşleştirme: slot aralığını tamamen kapsayan kurallar içinde
 * güne özel kural (day_of_week dolu) genel kuraldan (null) önceliklidir.
 * DB tarafındaki validate_reservation() ile aynı mantık.
 */
export function findSlotPrice(
  rules: PriceRule[],
  dayOfWeek: number,
  slotStartMin: number,
  slotEndMin: number,
): number | null {
  const matching = rules.filter(
    (rule) =>
      (rule.day_of_week === null || rule.day_of_week === dayOfWeek) &&
      timeToMinutes(rule.start_time) <= slotStartMin &&
      timeToMinutes(rule.end_time) >= slotEndMin,
  )
  if (matching.length === 0) return null
  const specific = matching.find((rule) => rule.day_of_week !== null)
  return (specific ?? matching[0])?.price ?? null
}

export interface GenerateSlotsInput {
  /** İlgili günün çalışma saati kaydı (yoksa tesis o gün kapalı sayılır) */
  openingHour: OpeningHour | undefined
  /** Sahanın fiyat kuralları */
  priceRules: PriceRule[]
  /** Sahanın o günkü dolu aralıkları */
  bookedRanges: Pick<BookedRange, 'start_time' | 'end_time'>[]
  /** 0-6, 0 = Pazar */
  dayOfWeek: number
  /** Seçilen tarih bugünse şu anki dakika (geçmiş saatleri kapatmak için); değilse null */
  nowMinutes: number | null
}

/** Bir saha + gün için saatlik slot listesi üretir. */
export function generateSlots(input: GenerateSlotsInput): TimeSlot[] {
  const { openingHour, priceRules, bookedRanges, dayOfWeek, nowMinutes } = input
  if (!openingHour || openingHour.is_closed) return []

  const openMin = timeToMinutes(openingHour.open_time)
  const closeMin = timeToMinutes(openingHour.close_time)
  const stepMin = SLOT_DURATION_HOURS * 60

  const booked = bookedRanges.map((range) => ({
    start: timeToMinutes(range.start_time),
    end: timeToMinutes(range.end_time),
  }))

  const slots: TimeSlot[] = []
  for (let start = openMin; start + stepMin <= closeMin; start += stepMin) {
    const end = start + stepMin
    const price = findSlotPrice(priceRules, dayOfWeek, start, end)

    let status: SlotStatus = 'available'
    if (nowMinutes !== null && start <= nowMinutes) {
      status = 'past'
    } else if (booked.some((range) => rangesOverlap(start, end, range.start, range.end))) {
      status = 'booked'
    } else if (price === null) {
      status = 'unpriced'
    }

    slots.push({
      startTime: minutesToTime(start),
      endTime: minutesToTime(end),
      price,
      status,
    })
  }
  return slots
}

/** Europe/Istanbul saat dilimine göre bugünün tarihi ve dakikası. */
export function nowInIstanbul(): { date: string; minutes: number } {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = formatter.formatToParts(new Date())
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '00'
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  }
}
