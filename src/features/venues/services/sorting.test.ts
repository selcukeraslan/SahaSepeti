import { describe, expect, it } from 'vitest'
import type { VenueListItem } from '../types'
import { isNewVenue, isTopRated, sortVenues } from './sorting'

/** Test için minimal VenueListItem üretir (yalnızca kullanılan alanlar anlamlı). */
function makeVenue(overrides: Partial<VenueListItem> = {}): VenueListItem {
  return {
    id: crypto.randomUUID(),
    owner_id: 'o-1',
    name: 'Tesis',
    slug: 'tesis',
    description: '',
    city: 'İstanbul',
    district: 'Kadıköy',
    address: '',
    latitude: null,
    longitude: null,
    phone: null,
    cover_image_url: null,
    amenities: [],
    status: 'approved',
    rejection_reason: null,
    created_at: '2026-07-01T00:00:00Z',
    updated_at: '2026-07-01T00:00:00Z',
    sports: [],
    minPrice: null,
    avgRating: null,
    reviewCount: 0,
    ...overrides,
  }
}

describe('sortVenues', () => {
  it('ölçüt yoksa girdiyi aynen döner (referans dahil)', () => {
    const venues = [makeVenue({ name: 'A' }), makeVenue({ name: 'B' })]
    expect(sortVenues(venues, undefined)).toBe(venues)
  })

  it('puana göre azalan sıralar; puansızlar sona, eşitlikte çok yorumlu önce', () => {
    const venues = [
      makeVenue({ name: 'puansiz' }),
      makeVenue({ name: 'dusuk', avgRating: 3.2, reviewCount: 10 }),
      makeVenue({ name: 'yuksek-az-yorum', avgRating: 4.8, reviewCount: 3 }),
      makeVenue({ name: 'yuksek-cok-yorum', avgRating: 4.8, reviewCount: 12 }),
    ]
    const result = sortVenues(venues, 'rating').map((v) => v.name)
    expect(result).toEqual(['yuksek-cok-yorum', 'yuksek-az-yorum', 'dusuk', 'puansiz'])
  })

  it('fiyata göre artan/azalan sıralar; fiyatsızlar iki yönde de sona', () => {
    const venues = [
      makeVenue({ name: 'orta', minPrice: 1000 }),
      makeVenue({ name: 'fiyatsiz' }),
      makeVenue({ name: 'ucuz', minPrice: 500 }),
      makeVenue({ name: 'pahali', minPrice: 2000 }),
    ]
    expect(sortVenues(venues, 'price-asc').map((v) => v.name)).toEqual([
      'ucuz',
      'orta',
      'pahali',
      'fiyatsiz',
    ])
    expect(sortVenues(venues, 'price-desc').map((v) => v.name)).toEqual([
      'pahali',
      'orta',
      'ucuz',
      'fiyatsiz',
    ])
  })

  it('orijinal diziyi değiştirmez', () => {
    const venues = [makeVenue({ minPrice: 2 }), makeVenue({ minPrice: 1 })]
    const original = [...venues]
    sortVenues(venues, 'price-asc')
    expect(venues).toEqual(original)
  })
})

describe('isTopRated', () => {
  it('eşik: ortalama >= 4.5 VE yorum >= 3', () => {
    expect(isTopRated({ avgRating: 4.5, reviewCount: 3 })).toBe(true)
    expect(isTopRated({ avgRating: 4.9, reviewCount: 10 })).toBe(true)
    expect(isTopRated({ avgRating: 4.4, reviewCount: 10 })).toBe(false) // ortalama düşük
    expect(isTopRated({ avgRating: 5, reviewCount: 2 })).toBe(false) // yorum az
    expect(isTopRated({ avgRating: null, reviewCount: 0 })).toBe(false)
  })
})

describe('isNewVenue', () => {
  const TODAY = '2026-07-13'

  it('son 30 gün içindekiler yeni sayılır', () => {
    expect(isNewVenue('2026-07-01T10:00:00Z', TODAY)).toBe(true)
    expect(isNewVenue('2026-06-13T00:00:00Z', TODAY)).toBe(true) // tam 30 gün
    expect(isNewVenue('2026-06-12T00:00:00Z', TODAY)).toBe(false) // 31 gün
  })

  it('gelecek tarihli kayıt yeni sayılmaz (veri hatasına karşı)', () => {
    expect(isNewVenue('2026-08-01T00:00:00Z', TODAY)).toBe(false)
  })
})
