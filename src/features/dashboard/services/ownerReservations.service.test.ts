import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  from: vi.fn(), select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(), not: vi.fn(),
}))
vi.mock('@/lib/supabase', () => ({ supabase: { from: mocks.from } }))
import { listOwnerReservations } from './ownerReservations.service'

describe('owner reservation listing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const query = { ...mocks, then: (resolve: (value: { data: unknown[]; error: null }) => unknown) =>
      Promise.resolve({ data: [], error: null }).then(resolve) }
    for (const mock of Object.values(mocks)) mock.mockReturnValue(query)
  })
  it('en son oluşturulan kayıtları önce getirir; eşit zamanda kararlı sıralar', async () => {
    await listOwnerReservations({})
    expect(mocks.order.mock.calls).toEqual([
      ['created_at', { ascending: false }],
      ['id', { ascending: false }],
    ])
    expect(mocks.order.mock.invocationCallOrder[1]).toBeLessThan(mocks.limit.mock.invocationCallOrder[0]!)
  })
  it('tarih, tesis, durum ve kaynak filtrelerini korur', async () => {
    await listOwnerReservations({ venueId: 'venue', status: 'pending', source: 'marketplace', date: '2026-09-13', repeating: true })
    for (const pair of [
      ['is_block', false], ['series_superseded', false], ['venue_id', 'venue'],
      ['status', 'pending'], ['source', 'marketplace'], ['reservation_date', '2026-09-13'],
    ]) expect(mocks.eq).toHaveBeenCalledWith(...pair)
    expect(mocks.not).toHaveBeenCalledWith('series_id', 'is', null)
  })
})
