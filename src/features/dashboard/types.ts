import type { VenueStatus } from '@/types/database.types'

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
