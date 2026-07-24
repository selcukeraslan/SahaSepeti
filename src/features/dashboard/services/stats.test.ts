import { describe, expect, it } from 'vitest'
import { computeOwnerStats, rangeStartDate, type StatsReservation } from './stats'

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

describe('rangeStartDate', () => {
  it('dönem başlangıçlarını doğru hesaplar', () => {
    expect(rangeStartDate('1w', TODAY)).toBe('2026-07-06')
    expect(rangeStartDate('1m', TODAY)).toBe('2026-06-12')
    expect(rangeStartDate('6m', TODAY)).toBe('2026-01-12')
    expect(rangeStartDate('1y', TODAY)).toBe('2025-07-12')
    expect(rangeStartDate('all', TODAY)).toBeNull()
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
      [
        make({ status: 'cancelled' }),
        make({ status: 'completed' }),
        make({ status: 'completed' }),
        make({ status: 'completed' }),
      ],
      TODAY,
    )
    expect(stats.cancellationRate).toBeCloseTo(0.25)
  })

  it('dönem dışındaki ve gelecek tarihli rezervasyonları hariç tutar', () => {
    const data = [
      make({ reservation_date: '2026-07-10', total_price: 1000 }), // dönem içi
      make({ reservation_date: '2026-06-01', total_price: 2000 }), // son 1 haftanın dışında
      make({ reservation_date: '2026-08-01', total_price: 5000 }), // gelecek → her zaman hariç
    ]
    const week = computeOwnerStats(data, TODAY, '1w')
    expect(week.total).toBe(1)
    expect(week.revenue).toBe(1000)

    const all = computeOwnerStats(data, TODAY, 'all')
    expect(all.total).toBe(2) // gelecek hariç
    expect(all.revenue).toBe(3000)
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
    expect(stats.byHour[0]).toEqual({ label: '09', value: 1 })
    expect(stats.byHour[stats.byHour.length - 1]).toEqual({ label: '20', value: 2 })
  })

  it('1 hafta dönemi günlük 7 kova üretir', () => {
    const stats = computeOwnerStats([make({ reservation_date: '2026-07-10' })], TODAY, '1w')
    expect(stats.trend).toHaveLength(7)
  })

  it('6 ay dönemi aylık trend üretir; temmuz kovasında değer var', () => {
    const stats = computeOwnerStats([make({ reservation_date: '2026-07-10' })], TODAY, '6m')
    const last = stats.trend[stats.trend.length - 1]
    expect(last?.label).toBe('Tem')
    expect(last?.count).toBe(1)
  })

  it('ısı haritası gün×saat doluluğunu doğru sayar; iptaller girmez', () => {
    const stats = computeOwnerStats(
      [
        make({ reservation_date: '2026-07-11', start_time: '20:00:00' }), // Cumartesi 20
        make({ reservation_date: '2026-07-04', start_time: '20:00:00' }), // Cumartesi 20
        make({ reservation_date: '2026-07-06', start_time: '09:00:00' }), // Pazartesi 09
        make({ reservation_date: '2026-07-06', start_time: '20:00:00', status: 'cancelled' }), // sayılmaz
      ],
      TODAY,
    )
    // gözlemlenen saat aralığı 09..20
    expect(stats.heatmap.hours[0]).toBe(9)
    expect(stats.heatmap.hours[stats.heatmap.hours.length - 1]).toBe(20)
    expect(stats.heatmap.max).toBe(2) // Cumartesi 20:00 → 2 rezervasyon
    // Cumartesi = Pzt tabanlı index 5; son saat (20) sütunu
    const saturdayRow = stats.heatmap.grid[5]
    expect(saturdayRow?.[saturdayRow.length - 1]).toBe(2)
    // Pazartesi = index 0; 09:00 sütunu (ilk)
    expect(stats.heatmap.grid[0]?.[0]).toBe(1)
  })

  it('boş listede ısı haritası boş', () => {
    const stats = computeOwnerStats([], TODAY)
    expect(stats.heatmap.hours).toEqual([])
    expect(stats.heatmap.max).toBe(0)
  })
})
