import { beforeEach, describe, expect, it, vi } from 'vitest'

const supabaseMocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: supabaseMocks.getUser },
    rpc: supabaseMocks.rpc,
  },
}))

import { createReservation } from './reservations.service'

const input = {
  courtId: '00000000-0000-4000-8000-000000000001',
  venueId: '00000000-0000-4000-8000-000000000002',
  date: '2026-09-10',
  startTime: '19:00',
  endTime: '20:00',
  expectedTotalPrice: 1200,
}

describe('createReservation', () => {
  it('RPC imza çakışmasında teknik veritabanı detaylarını göstermez', async () => {
    supabaseMocks.rpc.mockResolvedValue({ data: null, error: { code: 'PGRST203', message: 'function signatures' } })
    await expect(createReservation(input)).rejects.toThrow('Rezervasyon servisi güncelleniyor.')
  })
  it('fiyat değiştiğinde güncel sunucu fiyatını taşır ve otomatik yeniden denemez', async () => {
    supabaseMocks.rpc.mockResolvedValue({
      data: null, error: { code: 'P0002', details: '{"currentTotalPrice":1500}' },
    })
    await expect(createReservation(input)).rejects.toMatchObject({ currentTotalPrice: 1500 })
    expect(supabaseMocks.rpc).toHaveBeenCalledTimes(1)
  })
  it('istemcinin kaynak ve referans alanlarını DB isteğine taşımaz', async () => {
    supabaseMocks.rpc.mockResolvedValue({ data: { id: 'reservation-1', source: 'marketplace' }, error: null })
    await createReservation({ ...input, ...{
      source: 'manual', created_by: 'other-user', guest_reference: 'fake',
      external_provider: 'fake', external_reservation_id: 'fake',
    } })
    const payload: unknown = supabaseMocks.rpc.mock.calls[0]?.[1]
    expect(payload).toMatchObject({ p_expected_total_price: 1200 })
    expect(payload).not.toHaveProperty('p_source')
  })
  beforeEach(() => {
    vi.clearAllMocks()
    supabaseMocks.getUser.mockResolvedValue({ data: { user: { id: 'customer-1' } } })
  })

  it('çakışan slot hatasını kullanıcı dostu mesaja dönüştürür', async () => {
    supabaseMocks.rpc.mockResolvedValue({
      data: null,
      error: { code: '23P01', message: 'conflicting key value violates exclusion constraint' },
    })

    await expect(createReservation(input)).rejects.toThrow(
      'Bu saat az önce doldu. Lütfen başka bir saat seçin.',
    )
  })

  it('oturum yoksa rezervasyon isteği göndermeden durur', async () => {
    supabaseMocks.getUser.mockResolvedValue({ data: { user: null } })

    await expect(createReservation(input)).rejects.toThrow('Rezervasyon için giriş yapmalısınız')
    expect(supabaseMocks.rpc).not.toHaveBeenCalled()
  })
})
