import { timeToMinutes } from '@/features/venues/services/slots'

interface ReservationTime {
  reservation_date: string
  start_time: string
  end_time: string
}

interface IstanbulNow {
  date: string
  minutes: number
}

export interface ReservationActionAvailability {
  canComplete: boolean
  canMarkNoShow: boolean
  canCancel: boolean
}

/** Owner aksiyonlarını veritabanındaki zaman kurallarıyla aynı şekilde sınırlar. */
export function getReservationActionAvailability(
  reservation: ReservationTime,
  now: IstanbulNow,
): ReservationActionAvailability {
  const isPastDate = reservation.reservation_date < now.date
  const isToday = reservation.reservation_date === now.date
  const hasStarted =
    isPastDate || (isToday && timeToMinutes(reservation.start_time) <= now.minutes)
  const hasEnded =
    isPastDate || (isToday && timeToMinutes(reservation.end_time) <= now.minutes)

  return {
    canComplete: hasEnded,
    canMarkNoShow: hasStarted,
    canCancel: !hasStarted,
  }
}
