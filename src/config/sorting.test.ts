import { describe, expect, it } from 'vitest'
import { ALL_CITY_NAMES } from './cities'
import { sortSportsByPriority } from './sports'

describe('öncelikli filtre sıralamaları', () => {
  it('büyük şehirleri istenen sırada öne alır, kalanları alfabetik tutar', () => {
    expect(ALL_CITY_NAMES.slice(0, 3)).toEqual(['İstanbul', 'Ankara', 'İzmir'])
    expect(ALL_CITY_NAMES.slice(3)).toEqual(
      [...ALL_CITY_NAMES.slice(3)].sort((left, right) => left.localeCompare(right, 'tr')),
    )
  })

  it('halı saha ve basketbolu diğer sporlardan önce gösterir', () => {
    const sports = [
      { slug: 'voleybol', name: 'Voleybol' },
      { slug: 'tenis', name: 'Tenis' },
      { slug: 'basketbol', name: 'Basketbol' },
      { slug: 'badminton', name: 'Badminton' },
      { slug: 'hali-saha', name: 'Halı Saha' },
    ]

    expect(sortSportsByPriority(sports).map((sport) => sport.slug)).toEqual([
      'hali-saha',
      'basketbol',
      'badminton',
      'tenis',
      'voleybol',
    ])
  })
})
