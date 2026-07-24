import {
  differenceInCalendarMonths,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  eachYearOfInterval,
  format,
  parseISO,
  startOfWeek,
  subDays,
  subMonths,
  subYears,
} from 'date-fns'
import { tr } from 'date-fns/locale'
import type { ReservationStatus } from '@/types/database.types'

/** İstatistik hesabı için gereken minimal rezervasyon alanları. */
export interface StatsReservation {
  reservation_date: string // yyyy-MM-dd
  start_time: string // HH:mm[:ss]
  status: ReservationStatus
  total_price: number
  venue_id: string
}

export type StatsRange = '1w' | '1m' | '6m' | '1y' | 'all'

/** Dönem seçenekleri — kısa etiketler (buton grubu için). */
export const STATS_RANGES: { value: StatsRange; label: string }[] = [
  { value: '1w', label: '1 Hafta' },
  { value: '1m', label: '1 Ay' },
  { value: '6m', label: '6 Ay' },
  { value: '1y', label: '1 Yıl' },
  { value: 'all', label: 'Tümü' },
]

export interface BarDatum {
  label: string
  value: number
}

export interface TrendDatum {
  label: string
  count: number
  revenue: number
}

export interface StatusBreakdown {
  pending: number
  confirmed: number
  completed: number
  cancelled: number
}

export interface OwnerStats {
  total: number
  /** iptal olmayan rezervasyon sayısı */
  active: number
  /** tahmini gelir — onaylanan + tamamlanan (iptal/bekleyen hariç) */
  revenue: number
  /** 0-1 arası iptal oranı */
  cancellationRate: number
  status: StatusBreakdown
  /** seçili döneme göre uygun granülerlikte trend (gün/hafta/ay/yıl) */
  trend: TrendDatum[]
  /** gözlemlenen en erken–en geç saat aralığı (veri yoksa boş) */
  byHour: BarDatum[]
  /** haftanın günleri, Pazartesi→Pazar */
  byDay: BarDatum[]
  busiestHour: string | null
  busiestDay: string | null
}

type Granularity = 'day' | 'week' | 'month' | 'year'

const DAY_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
const DAY_FULL = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']
const WEEK_OPTS = { weekStartsOn: 1 as const }

/** Gelir sayılan durumlar (gerçek ödeme yok; total_price sunucuda hesaplanır). */
const REVENUE_STATUSES: ReadonlySet<ReservationStatus> = new Set(['confirmed', 'completed'])

function hourOf(startTime: string): number {
  return Number(startTime.slice(0, 2))
}

/** getDay: 0=Pazar..6=Cumartesi → Pazartesi tabanlı 0..6 */
function mondayIndex(dateStr: string): number {
  return (parseISO(dateStr).getDay() + 6) % 7
}

function argmax(counts: number[]): number | null {
  let bestIndex = -1
  let bestValue = 0
  for (let i = 0; i < counts.length; i++) {
    const value = counts[i] ?? 0
    if (value > bestValue) {
      bestValue = value
      bestIndex = i
    }
  }
  return bestIndex === -1 ? null : bestIndex
}

/** Seçili dönemin başlangıç tarihi (dahil); 'all' için sınır yok (null). */
export function rangeStartDate(range: StatsRange, todayYmd: string): string | null {
  if (range === 'all') return null
  const today = parseISO(todayYmd)
  const start =
    range === '1w'
      ? subDays(today, 6) // 7 gün: bugün + 6 gün öncesi
      : range === '1m'
        ? subMonths(today, 1)
        : range === '6m'
          ? subMonths(today, 6)
          : subYears(today, 1) // 1y
  return format(start, 'yyyy-MM-dd')
}

function bucketKey(dateStr: string, gran: Granularity): string {
  switch (gran) {
    case 'day':
      return dateStr
    case 'week':
      return format(startOfWeek(parseISO(dateStr), WEEK_OPTS), 'yyyy-MM-dd')
    case 'month':
      return dateStr.slice(0, 7)
    case 'year':
      return dateStr.slice(0, 4)
  }
}

function buildBuckets(startStr: string, endStr: string, gran: Granularity): { key: string; label: string }[] {
  const start = parseISO(startStr)
  const end = parseISO(endStr)
  if (start > end) return []

  switch (gran) {
    case 'day':
      return eachDayOfInterval({ start, end }).map((d) => ({
        key: format(d, 'yyyy-MM-dd'),
        label: format(d, 'EEE', { locale: tr }),
      }))
    case 'week':
      return eachWeekOfInterval({ start, end }, WEEK_OPTS).map((d) => ({
        key: format(d, 'yyyy-MM-dd'),
        label: format(d, 'd MMM', { locale: tr }),
      }))
    case 'month':
      return eachMonthOfInterval({ start, end }).map((d) => ({
        key: format(d, 'yyyy-MM'),
        label: format(d, 'MMM', { locale: tr }),
      }))
    case 'year':
      return eachYearOfInterval({ start, end }).map((d) => ({
        key: format(d, 'yyyy'),
        label: format(d, 'yyyy'),
      }))
  }
}

function resolveGranularity(range: StatsRange, bucketStart: string, todayYmd: string): Granularity {
  if (range === '1w') return 'day'
  if (range === '1m') return 'week'
  if (range === '6m' || range === '1y') return 'month'
  // 'all': çok geniş aralıkta yıllık, aksi halde aylık
  return differenceInCalendarMonths(parseISO(todayYmd), parseISO(bucketStart)) > 12 ? 'year' : 'month'
}

export function computeOwnerStats(
  reservations: StatsReservation[],
  todayYmd: string,
  range: StatsRange = 'all',
): OwnerStats {
  const startStr = rangeStartDate(range, todayYmd)
  // Dönem: [start, bugün] — gelecek tarihli rezervasyonlar istatistiğe girmez.
  const filtered = reservations.filter(
    (r) => r.reservation_date <= todayYmd && (startStr === null || r.reservation_date >= startStr),
  )

  const status: StatusBreakdown = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 }
  let revenue = 0
  const hourCount = new Array<number>(24).fill(0)
  const dayCount = new Array<number>(7).fill(0)
  let minDate: string | null = null

  for (const r of filtered) {
    status[r.status] += 1
    if (REVENUE_STATUSES.has(r.status)) revenue += r.total_price
    if (r.status !== 'cancelled') {
      const h = hourOf(r.start_time)
      hourCount[h] = (hourCount[h] ?? 0) + 1
      const d = mondayIndex(r.reservation_date)
      dayCount[d] = (dayCount[d] ?? 0) + 1
    }
    if (minDate === null || r.reservation_date < minDate) minDate = r.reservation_date
  }

  const total = filtered.length

  // Trend: dönem başlangıcından bugüne uygun granülerlikte kovalar
  const bucketStart = startStr ?? minDate ?? todayYmd
  const gran = resolveGranularity(range, bucketStart, todayYmd)
  const buckets = buildBuckets(bucketStart, todayYmd, gran)
  const countMap = new Map<string, number>()
  const revMap = new Map<string, number>()
  for (const r of filtered) {
    const key = bucketKey(r.reservation_date, gran)
    if (r.status !== 'cancelled') countMap.set(key, (countMap.get(key) ?? 0) + 1)
    if (REVENUE_STATUSES.has(r.status)) revMap.set(key, (revMap.get(key) ?? 0) + r.total_price)
  }
  const trend: TrendDatum[] = buckets.map((b) => ({
    label: b.label,
    count: countMap.get(b.key) ?? 0,
    revenue: revMap.get(b.key) ?? 0,
  }))

  // Saat dağılımı: yalnızca gözlemlenen en erken–en geç saat aralığı
  const activeHours = hourCount
    .map((count, hour) => ({ hour, count }))
    .filter((item) => item.count > 0)
  const byHour: BarDatum[] = []
  if (activeHours.length > 0) {
    const min = Math.min(...activeHours.map((item) => item.hour))
    const max = Math.max(...activeHours.map((item) => item.hour))
    for (let h = min; h <= max; h++) {
      byHour.push({ label: String(h).padStart(2, '0'), value: hourCount[h] ?? 0 })
    }
  }

  const byDay: BarDatum[] = DAY_SHORT.map((label, i) => ({ label, value: dayCount[i] ?? 0 }))

  const busiestHourIdx = argmax(hourCount)
  const busiestDayIdx = argmax(dayCount)

  return {
    total,
    active: total - status.cancelled,
    revenue,
    cancellationRate: total > 0 ? status.cancelled / total : 0,
    status,
    trend,
    byHour,
    byDay,
    busiestHour: busiestHourIdx === null ? null : `${String(busiestHourIdx).padStart(2, '0')}:00`,
    busiestDay: busiestDayIdx === null ? null : (DAY_FULL[busiestDayIdx] ?? null),
  }
}
