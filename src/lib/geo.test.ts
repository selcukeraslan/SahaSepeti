import { describe, expect, it } from 'vitest'
import { distanceToOrNull, formatDistance, haversineKm } from './geo'

const ISTANBUL = { lat: 41.0082, lng: 28.9784 }
const ANKARA = { lat: 39.9334, lng: 32.8597 }

describe('haversineKm', () => {
  it('İstanbul–Ankara mesafesini doğru hesaplar (~350 km)', () => {
    const km = haversineKm(ISTANBUL, ANKARA)
    expect(km).toBeGreaterThan(345)
    expect(km).toBeLessThan(360)
  })

  it('aynı nokta için 0 döner', () => {
    expect(haversineKm(ISTANBUL, ISTANBUL)).toBe(0)
  })

  it('simetriktir', () => {
    expect(haversineKm(ISTANBUL, ANKARA)).toBeCloseTo(haversineKm(ANKARA, ISTANBUL), 10)
  })
})

describe('formatDistance', () => {
  it('1 km altını metre olarak gösterir', () => {
    expect(formatDistance(0.85)).toBe('850 m')
    expect(formatDistance(0.049)).toBe('49 m')
  })

  it('1 km ve üzerini tr-TR biçiminde km gösterir', () => {
    expect(formatDistance(2.43)).toBe('2,4 km')
    expect(formatDistance(12)).toBe('12 km')
  })

  it('1 km sınırında "1000 m" yerine "1 km" gösterir', () => {
    expect(formatDistance(0.9996)).toBe('1 km')
    expect(formatDistance(0.9994)).toBe('999 m')
  })
})

describe('distanceToOrNull', () => {
  it('koordinatı olmayan kayıt için null döner', () => {
    expect(distanceToOrNull({ latitude: null, longitude: 29 }, ISTANBUL)).toBeNull()
    expect(distanceToOrNull({ latitude: 41, longitude: null }, ISTANBUL)).toBeNull()
  })

  it('koordinatı olan kayıt için mesafe döner', () => {
    const km = distanceToOrNull({ latitude: ANKARA.lat, longitude: ANKARA.lng }, ISTANBUL)
    expect(km).not.toBeNull()
    expect(km as number).toBeGreaterThan(300)
  })
})
