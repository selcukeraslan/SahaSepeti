import { describe, expect, it } from 'vitest'
import { seriesInputSchema } from './series.schemas'

const input = {
  action: 'create', venueId: '10000000-0000-4000-8000-000000000001',
  courtId: '10000000-0000-4000-8000-000000000002', name: 'Haftalık takım',
  guestName: 'Test Misafir', date: '2026-12-29', startTime: '20:00', endTime: '21:00', weeks: 4,
}
describe('seriesInputSchema', () => {
  it('yıl sonundaki haftalık seri girdisini kabul eder', () => {
    expect(seriesInputSchema.parse(input)).toMatchObject({ date: '2026-12-29', weeks: 4 })
  })
  it.each([0, 53, 1.5, NaN])('geçersiz hafta sayısını reddeder: %s', (weeks) => {
    expect(seriesInputSchema.safeParse({ ...input, weeks }).success).toBe(false)
  })
  it.each(['2026-02-30', '2026-13-01', '07/09/2026'])('geçersiz tarihi reddeder: %s', (date) => {
    expect(seriesInputSchema.safeParse({ ...input, date }).success).toBe(false)
  })
  it.each(['20:30', '22:00', '19:00', '25:00'])('bir saat olmayan/geçersiz aralığı reddeder: %s', (endTime) => {
    expect(seriesInputSchema.safeParse({ ...input, endTime }).success).toBe(false)
  })
  it.each(['one', 'following', 'all'])('iptal kapsamını kabul eder: %s', (scope) => {
    expect(seriesInputSchema.safeParse({ action: 'cancel', scope, reservationId: input.courtId }).success).toBe(true)
  })
  it('istemcinin fiyat ve kaynak alanlarını RPC girdisinden çıkarır', () => {
    const result = seriesInputSchema.parse({ ...input, total_price: 1, source: 'marketplace', created_by: 'fake' })
    expect(result).not.toHaveProperty('total_price')
    expect(result).not.toHaveProperty('source')
    expect(result).not.toHaveProperty('created_by')
  })
})
