import { z } from 'zod'

const quoteSchema = z.object({ currentTotalPrice: z.number().finite().nonnegative() })

export class ReservationPriceChangedError extends Error {
  readonly currentTotalPrice: number | null
  constructor(currentTotalPrice: number | null) {
    super('Fiyat değişti. Güncel fiyatı kontrol edip tekrar onaylayın.')
    this.name = 'ReservationPriceChangedError'
    this.currentTotalPrice = currentTotalPrice
  }
}

export function priceChangedError(details: string | null | undefined) {
  try {
    const parsed = quoteSchema.safeParse(JSON.parse(details ?? 'null'))
    return new ReservationPriceChangedError(parsed.success ? parsed.data.currentTotalPrice : null)
  } catch {
    return new ReservationPriceChangedError(null)
  }
}
