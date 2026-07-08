import type { Reservation, ReservationStatus } from '@/types/database.types'

/** "Rezervasyonlarım" listesi için tesis/saha özetiyle birlikte */
export interface ReservationWithVenue extends Reservation {
  venue: {
    name: string
    slug: string
    city: string
    district: string
    cover_image_url: string | null
  } | null
  court: { name: string } | null
}

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: 'Beklemede',
  confirmed: 'Onaylandı',
  cancelled: 'İptal edildi',
  completed: 'Tamamlandı',
}

export const RESERVATION_STATUS_VARIANTS: Record<
  ReservationStatus,
  'warning' | 'success' | 'danger' | 'neutral'
> = {
  pending: 'warning',
  confirmed: 'success',
  cancelled: 'danger',
  completed: 'neutral',
}
