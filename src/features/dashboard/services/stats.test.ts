import { describe, expect, it } from 'vitest'
import { computeOwnerStats, lastMonthKeys, type StatsReservation } from './stats'

function make(overrides: Partial<StatsReservation> = {}): StatsReservation {
  return {
    reservation_date: '2026-07-10',
    start_time: '20:00:00',
    status: 'completed',
    total_price: 1000,
    venue_id: 'v-1',
    ...overrides,
  }
}

const TODAY = '2026-07-12'

describe('lastMonthKeys', () => {
  it('yıl sınırını doğru aşar (son 6 ay)', () => {
    const result = lastMonthKeys('2026-01-15', 6)
    expect(result.map((m) => m.key)).toEqual([
      '2025-08',
      '2025-09',
      '2025-10',
      '2025-11',
      '2025-12',
      '2026-01',
    ])
    expect(result[result.length - 1]?.label).toBe('Oca')
    expect(result[0]?.label).toBe('Ağu')
  })
})

describe('computeOwnerStats', () => {
  it('boş listede güvenli sıfırlar döner', () => {
    const stats = computeOwnerStats([], TODAY)
    expect(stats.total).toBe(0)
    expect(stats.revenue).toBe(0)
    expect(stats.cancellationRate).toBe(0)
    expect(stats.busiestHour).toBeNull()
    expect(stats.busiestDay).toBeNull()
    expect(stats.byHour).toEqual([])
    expect(stats.monthly).toHaveLength(6)
  })

  it('geliri yalnızca onaylanan + tamamlanan durumlardan sayar', () => {
    const stats = computeOwnerStats(
      [
        make({ status: 'completed', total_price: 1000 }),
        make({ status: 'confirmed', total_price: 500 }),
        make({ status: 'pending', total_price: 999 }), // gelir DEĞİL
        make({ status: 'cancelled', total_price: 999 }), // gelir DEĞİL
      ],
      TODAY,
    )
    expect(stats.revenue).toBe(1500)
    expect(stats.total).toBe(4)
    expect(stats.active).toBe(3) // iptal hariç
    expect(stats.status).toEqual({ pending: 1, confirmed: 1, completed: 1, cancelled: 1 })
  })

  it('iptal oranını doğru hesaplar', () => {
    const stats = computeOwnerStats(
      [make({ status: 'cancelled' }), make({ status: 'completed' }), make({ status: 'completed' }), make({ status: 'completed' })],
      TODAY,
    )
    expect(stats.cancellationRate).toBeCloseTo(0.25)
  })

  it('bu ayın gelir ve adedini ayırır', () => {
    const stats = computeOwnerStats(
      [
        make({ reservation_date: '2026-07-03', status: 'completed', total_price: 1000 }),
        make({ reservation_date: '2026-06-20', status: 'completed', total_price: 2000 }), // geçen ay
      ],
      TODAY,
    )
    expect(stats.revenueThisMonth).toBe(1000)
    expect(stats.thisMonthCount).toBe(1)
    expect(stats.revenue).toBe(3000)
  })

  it('en yoğun saat ve günü bulur; iptaller dağılıma girmez', () => {
    const stats = computeOwnerStats(
      [
        make({ reservation_date: '2026-07-11', start_time: '20:00:00' }), // Cumartesi
        make({ reservation_date: '2026-07-04', start_time: '20:00:00' }), // Cumartesi
        make({ reservation_date: '2026-07-06', start_time: '09:00:00' }), // Pazartesi
        make({ reservation_date: '2026-07-06', start_time: '20:00:00', status: 'cancelled' }), // sayılmaz
      ],
      TODAY,
    )
    expect(stats.busiestHour).toBe('20:00')
    expect(stats.busiestDay).toBe('Cumartesi')
    // byHour aralığı 09..20, uçlarda değer var
    expect(stats.byHour[0]).toEqual({ label: '09', value: 1 })
    expect(stats.byHour[stats.byHour.length - 1]).toEqual({ label: '20', value: 2 })
  })

  it('aylık seri her zaman 6 nokta ve kronolojik', () => {
    const stats = computeOwnerStats([make({ reservation_date: '2026-07-10' })], TODAY)
    expect(stats.monthly).toHaveLength(6)
    expect(stats.monthly[5]?.label).toBe('Tem')
    expect(stats.monthly[5]?.count).toBe(1)
  })
})
