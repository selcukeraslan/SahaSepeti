import { describe, expect, it } from 'vitest'
import { priceChangedError, ReservationPriceChangedError } from './priceQuote'

describe('server price quote', () => {
  it('güncel tutarı yeni onay için taşır', () => {
    const error = priceChangedError('{"currentTotalPrice":1500.50}')
    expect(error).toBeInstanceOf(ReservationPriceChangedError)
    expect(error.currentTotalPrice).toBe(1500.5)
  })
  it.each([null, undefined, '', 'broken', '{}', '{"currentTotalPrice":-1}', '{"currentTotalPrice":"1000"}'])(
    'geçersiz teklif eski fiyatla devam ettirmez: %s', (details) => {
      expect(priceChangedError(details).currentTotalPrice).toBeNull()
    },
  )
})
