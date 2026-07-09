import { describe, expect, it } from 'vitest'
import {
  findSlotPrice,
  generateSlots,
  minutesToTime,
  timeToMinutes,
} from './slots'
import type { OpeningHour, PriceRule } from '@/types/database.types'

function makeOpeningHour(overrides: Partial<OpeningHour> = {}): OpeningHour {
  return {
    id: 'oh-1',
    venue_id: 'v-1',
    day_of_week: 1,
    open_time: '09:00:00',
    close_time: '13:00:00',
    is_closed: false,
    ...overrides,
  }
}

function makeRule(overrides: Partial<PriceRule> = {}): PriceRule {
  return {
    id: 'pr-1',
    court_id: 'c-1',
    day_of_week: null,
    start_time: '09:00:00',
    end_time: '23:00:00',
    price: 1000,
    currency: 'TRY',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('timeToMinutes / minutesToTime', () => {
  it('çevirileri doğru yapar', () => {
    expect(timeToMinutes('09:30')).toBe(570)
    expect(timeToMinutes('09:30:00')).toBe(570)
    expect(minutesToTime(570)).toBe('09:30')
    expect(minutesToTime(0)).toBe('00:00')
  })
})

describe('findSlotPrice', () => {
  it('genel kuralı uygular', () => {
    expect(findSlotPrice([makeRule()], 3, 600, 660)).toBe(1000)
  })

  it('güne özel kural genel kuraldan önceliklidir', () => {
    const rules = [makeRule(), makeRule({ id: 'pr-2', day_of_week: 6, price: 1500 })]
    expect(findSlotPrice(rules, 6, 600, 660)).toBe(1500)
    expect(findSlotPrice(rules, 2, 600, 660)).toBe(1000)
  })

  it('slotu tamamen kapsamayan kural eşleşmez', () => {
    const rules = [makeRule({ start_time: '10:00:00', end_time: '11:00:00' })]
    expect(findSlotPrice(rules, 1, 630, 690)).toBeNull()
  })

  it('çakışan genel kurallarda deterministik (DB sıralaması ile aynı) sonuç verir', () => {
    // Aynı start/end → price ile sıralama; düşük fiyat kazanır (DB: order by ... price)
    const rules = [
      makeRule({ id: 'pr-b', price: 900 }),
      makeRule({ id: 'pr-a', price: 800 }),
    ]
    expect(findSlotPrice(rules, 3, 600, 660)).toBe(800)
  })
})

describe('generateSlots', () => {
  it('çalışma saatlerine göre saatlik slot üretir', () => {
    const slots = generateSlots({
      openingHour: makeOpeningHour(),
      priceRules: [makeRule()],
      bookedRanges: [],
      dayOfWeek: 1,
      nowMinutes: null,
    })
    expect(slots.map((slot) => slot.startTime)).toEqual(['09:00', '10:00', '11:00', '12:00'])
    expect(slots.every((slot) => slot.status === 'available' && slot.price === 1000)).toBe(true)
  })

  it('kapalı günde boş liste döner', () => {
    expect(
      generateSlots({
        openingHour: makeOpeningHour({ is_closed: true }),
        priceRules: [makeRule()],
        bookedRanges: [],
        dayOfWeek: 1,
        nowMinutes: null,
      }),
    ).toEqual([])
    expect(
      generateSlots({
        openingHour: undefined,
        priceRules: [makeRule()],
        bookedRanges: [],
        dayOfWeek: 1,
        nowMinutes: null,
      }),
    ).toEqual([])
  })

  it('rezerve edilmiş aralıkla çakışan slot "booked" olur', () => {
    const slots = generateSlots({
      openingHour: makeOpeningHour(),
      priceRules: [makeRule()],
      bookedRanges: [{ start_time: '10:00:00', end_time: '11:00:00' }],
      dayOfWeek: 1,
      nowMinutes: null,
    })
    expect(slots.find((slot) => slot.startTime === '10:00')?.status).toBe('booked')
    expect(slots.find((slot) => slot.startTime === '11:00')?.status).toBe('available')
  })

  it('geçmiş saatler "past" olur', () => {
    const slots = generateSlots({
      openingHour: makeOpeningHour(),
      priceRules: [makeRule()],
      bookedRanges: [],
      dayOfWeek: 1,
      nowMinutes: timeToMinutes('10:30'),
    })
    expect(slots.find((slot) => slot.startTime === '09:00')?.status).toBe('past')
    expect(slots.find((slot) => slot.startTime === '10:00')?.status).toBe('past')
    expect(slots.find((slot) => slot.startTime === '11:00')?.status).toBe('available')
  })

  it('fiyat kuralı olmayan slot "unpriced" olur ve seçilemez', () => {
    const slots = generateSlots({
      openingHour: makeOpeningHour(),
      priceRules: [],
      bookedRanges: [],
      dayOfWeek: 1,
      nowMinutes: null,
    })
    expect(slots.every((slot) => slot.status === 'unpriced')).toBe(true)
  })

  it('dolu + geçmiş çakışmasında geçmiş öncelikli etiketlenir', () => {
    const slots = generateSlots({
      openingHour: makeOpeningHour(),
      priceRules: [makeRule()],
      bookedRanges: [{ start_time: '09:00:00', end_time: '10:00:00' }],
      dayOfWeek: 1,
      nowMinutes: timeToMinutes('09:30'),
    })
    expect(slots.find((slot) => slot.startTime === '09:00')?.status).toBe('past')
  })
})
