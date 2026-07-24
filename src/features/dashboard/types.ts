import type { ReservationStatus, VenueStatus } from '@/types/database.types'

export const VENUE_STATUS_LABELS: Record<VenueStatus, string> = {
  draft: 'Taslak',
  pending: 'Onay bekliyor',
  approved: 'Yayında',
  rejected: 'Reddedildi',
  suspended: 'Askıya alındı',
}

export const VENUE_STATUS_VARIANTS: Record<
  VenueStatus,
  'neutral' | 'warning' | 'success' | 'danger'
> = {
  draft: 'neutral',
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  suspended: 'danger',
}

export const DAY_NAMES_TR = [
  'Pazar',
  'Pazartesi',
  'Salı',
  'Çarşamba',
  'Perşembe',
  'Cuma',
  'Cumartesi',
] as const

/** Haftayı Pazartesi'den başlatan gün sırası */
export const WEEK_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const

// ---------- Takvim / owner günlük program ----------

/** Bir slotta oturan rezervasyon/blok özeti (owner görünümü). */
export interface ScheduleReservation {
  id: string
  status: ReservationStatus
  isBlock: boolean
  noShow: boolean
  /** Owner silebilir mi (blok ya da misafir kaydı); gerçek müşteri rez. silinemez */
  deletable: boolean
  /** Müşteri adı, misafir adı ya da "Müşteri" */
  customerName: string
  customerPhone: string | null
  notes: string | null
}

export type ScheduleSlotStatus = 'available' | 'booked' | 'blocked' | 'past' | 'unpriced'

export interface ScheduleSlot {
  startTime: string
  endTime: string
  price: number | null
  status: ScheduleSlotStatus
  reservation: ScheduleReservation | null
}

export interface CourtSchedule {
  courtId: string
  courtName: string
  isIndoor: boolean
  /** O gün çalışma saati yoksa/kapalıysa */
  isClosedToday: boolean
  slots: ScheduleSlot[]
}
