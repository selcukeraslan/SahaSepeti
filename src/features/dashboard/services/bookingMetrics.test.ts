import { afterEach, expect, it } from 'vitest'
import { recordManualBookingDuration } from './bookingMetrics'

afterEach(() => performance.clearMeasures('sahasepeti.manual-booking'))
it('beş ölçümü kimlik veya iletişim verisi olmadan saklar', () => {
  for (let index = 0; index < 5; index++) recordManualBookingDuration(performance.now())
  const entries = performance.getEntriesByName('sahasepeti.manual-booking', 'measure')
  expect(entries).toHaveLength(5)
  expect(entries.every((entry) => entry.duration >= 0)).toBe(true)
  expect(JSON.stringify(entries)).not.toContain('customer')
})
it('geçersiz veya gelecek başlangıç zamanını ölçmez', () => {
  recordManualBookingDuration(NaN)
  recordManualBookingDuration(-1)
  recordManualBookingDuration(performance.now() + 100000)
  expect(performance.getEntriesByName('sahasepeti.manual-booking', 'measure')).toHaveLength(0)
})
