import { describe, expect, it } from 'vitest'
import { getReservationActionAvailability } from './reservationActions'

const reservation = {
  reservation_date: '2026-09-05',
  start_time: '21:00:00',
  end_time: '22:00:00',
}

describe('getReservationActionAvailability', () => {
  it('gelecekteki rezervasyonda yalnızca iptale izin verir', () => {
    expect(
      getReservationActionAvailability(reservation, { date: '2026-09-03', minutes: 12 * 60 }),
    ).toEqual({ canComplete: false, canMarkNoShow: false, canCancel: true })
  })

  it('başladıktan sonra no-show işaretlemeye izin verir', () => {
    expect(
      getReservationActionAvailability(reservation, { date: '2026-09-05', minutes: 21 * 60 }),
    ).toEqual({ canComplete: false, canMarkNoShow: true, canCancel: false })
  })

  it('bittikten sonra tamamlamaya izin verir', () => {
    expect(
      getReservationActionAvailability(reservation, { date: '2026-09-05', minutes: 22 * 60 }),
    ).toEqual({ canComplete: true, canMarkNoShow: true, canCancel: false })
  })

  it('geçmiş tarihli rezervasyonda tamamlamaya ve no-show işaretlemeye izin verir', () => {
    expect(
      getReservationActionAvailability(reservation, { date: '2026-09-06', minutes: 0 }),
    ).toEqual({ canComplete: true, canMarkNoShow: true, canCancel: false })
  })
})
