import { parseISO } from 'date-fns'
import type { ReservationStatus } from '@/types/database.types'

/** İstatistik hesabı için gereken minimal rezervasyon alanları. */
export interface StatsReservation {
  reservation_date: string // yyyy-MM-dd
  start_time: string // HH:mm[:ss]
  status: ReservationStatus
  total_price: number
  venue_id: string
}

export interface BarDatum {
  label: string
  value: number
}

export interface MonthlyDatum {
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
  revenueThisMonth: number
  thisMonthCount: number
  /** 0-1 arası iptal oranı */
  cancellationRate: number
  status: StatusBreakdown
  /** son 6 ay, kronolojik */
  monthly: MonthlyDatum[]
  /** gözlemlenen en erken–en geç saat aralığı (veri yoksa boş) */
  byHour: BarDatum[]
  /** haftanın günleri, Pazartesi→Pazar */
  byDay: BarDatum[]
  busiestHour: string | null
  busiestDay: string | null
}

const MONTH_SHORT = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
const DAY_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
const DAY_FULL = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

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

/** Bugünden geriye son n ayın anahtar (yyyy-MM) + kısa etiketini üretir (kronolojik). */
export function lastMonthKeys(todayYmd: string, n: number): { key: string; label: string }[] {
  const [yearPart, monthPart] = todayYmd.split('-')
  const year = Number(yearPart)
  const month = Number(monthPart) // 1-12
  const out: { key: string; label: string }[] = []
  for (let i = n - 1; i >= 0; i--) {
    let y = year
    let m = month - i
    while (m <= 0) {
      m += 12
      y -= 1
    }
    out.push({ key: `${y}-${String(m).padStart(2, '0')}`, label: MONTH_SHORT[m - 1] ?? '' })
  }
  return out
}

export function computeOwnerStats(reservations: StatsReservation[], todayYmd: string): OwnerStats {
  const thisMonth = todayYmd.slice(0, 7)

  const status: StatusBreakdown = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 }
  let revenue = 0
  let revenueThisMonth = 0
  let thisMonthCount = 0

  const monthlyCount = new Map<string, number>()
  const monthlyRevenue = new Map<string, number>()
  const hourCount = new Array<number>(24).fill(0)
  const dayCount = new Array<number>(7).fill(0)

  for (const r of reservations) {
    status[r.status] += 1
    const monthKey = r.reservation_date.slice(0, 7)

    if (REVENUE_STATUSES.has(r.status)) {
      revenue += r.total_price
      if (monthKey === thisMonth) revenueThisMonth += r.total_price
      monthlyRevenue.set(monthKey, (monthlyRevenue.get(monthKey) ?? 0) + r.total_price)
    }

    if (r.status !== 'cancelled') {
      monthlyCount.set(monthKey, (monthlyCount.get(monthKey) ?? 0) + 1)
      const h = hourOf(r.start_time)
      hourCount[h] = (hourCount[h] ?? 0) + 1
      const d = mondayIndex(r.reservation_date)
      dayCount[d] = (dayCount[d] ?? 0) + 1
      if (monthKey === thisMonth) thisMonthCount += 1
    }
  }

  const total = reservations.length

  const monthly: MonthlyDatum[] = lastMonthKeys(todayYmd, 6).map(({ key, label }) => ({
    label,
    count: monthlyCount.get(key) ?? 0,
    revenue: monthlyRevenue.get(key) ?? 0,
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
    revenueThisMonth,
    thisMonthCount,
    cancellationRate: total > 0 ? status.cancelled / total : 0,
    status,
    monthly,
    byHour,
    byDay,
    busiestHour: busiestHourIdx === null ? null : `${String(busiestHourIdx).padStart(2, '0')}:00`,
    busiestDay: busiestDayIdx === null ? null : (DAY_FULL[busiestDayIdx] ?? null),
  }
}
