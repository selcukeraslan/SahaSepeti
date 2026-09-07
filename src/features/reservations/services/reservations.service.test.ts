import { beforeEach, describe, expect, it, vi } from 'vitest'

const supabaseMocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
  single: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: supabaseMocks.getUser },
    from: supabaseMocks.from,
  },
}))

import { createReservation } from './reservations.service'

const input = {
  courtId: '00000000-0000-4000-8000-000000000001',
  venueId: '00000000-0000-4000-8000-000000000002',
  date: '2026-09-10',
  startTime: '19:00',
  endTime: '20:00',
}

describe('createReservation', () => {
  it('istemcinin kaynak ve referans alanlarını DB isteğine taşımaz', async () => {
    supabaseMocks.single.mockResolvedValue({ data: { id: 'reservation-1', source: 'marketplace' }, error: null })
    await createReservation({ ...input, ...{
      source: 'manual', created_by: 'other-user', guest_reference: 'fake',
      external_provider: 'fake', external_reservation_id: 'fake',
    } })
    const payload: unknown = supabaseMocks.insert.mock.calls[0]?.[0]
    expect(payload).toMatchObject({ customer_id: 'customer-1' })
    for (const field of ['source', 'created_by', 'guest_reference', 'external_provider', 'external_reservation_id']) {
      expect(payload).not.toHaveProperty(field)
    }
  })
  beforeEach(() => {
    vi.clearAllMocks()
    supabaseMocks.getUser.mockResolvedValue({ data: { user: { id: 'customer-1' } } })
    supabaseMocks.from.mockReturnValue({ insert: supabaseMocks.insert })
    supabaseMocks.insert.mockReturnValue({ select: supabaseMocks.select })
    supabaseMocks.select.mockReturnValue({ single: supabaseMocks.single })
  })

  it('çakışan slot hatasını kullanıcı dostu mesaja dönüştürür', async () => {
    supabaseMocks.single.mockResolvedValue({
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
    expect(supabaseMocks.from).not.toHaveBeenCalled()
  })
})
