import { describe, expect, it } from 'vitest'
import { createReservationSchema } from './schemas'

const base = {
  courtId: '00000000-0000-4000-8000-000000000001',
  venueId: '00000000-0000-4000-8000-000000000002',
  date: '2026-08-06',
  startTime: '19:00',
  endTime: '20:00',
}

describe('createReservationSchema', () => {
  it('tam bir saatlik rezervasyonu kabul eder', () => {
    expect(createReservationSchema.safeParse(base).success).toBe(true)
  })

  it('istemcide değiştirilmiş süreyi reddeder', () => {
    expect(createReservationSchema.safeParse({ ...base, endTime: '21:00' }).success).toBe(false)
  })
})
