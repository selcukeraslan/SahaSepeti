import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { rpc: mocks.rpc } }))
import { deleteCustomer } from './customers.service'

describe('deleteCustomer', () => {
  beforeEach(() => vi.clearAllMocks())
  it('geçersiz kimliği sunucuya göndermez', async () => {
    await expect(deleteCustomer('invalid')).rejects.toThrow()
    expect(mocks.rpc).not.toHaveBeenCalled()
  })
  it('yalnızca kontrollü silme RPC fonksiyonunu çağırır', async () => {
    mocks.rpc.mockResolvedValue({ error: null })
    await deleteCustomer('16000000-0000-4000-8000-000000000001')
    expect(mocks.rpc).toHaveBeenCalledWith('delete_venue_customer', { p_id: '16000000-0000-4000-8000-000000000001' })
  })
  it('yetki hatasını kullanıcıya aktarır', async () => {
    mocks.rpc.mockResolvedValue({ error: { code: 'P0001', message: 'Müşteri silme yetkiniz yok' } })
    await expect(deleteCustomer('16000000-0000-4000-8000-000000000001')).rejects.toThrow('Müşteri silme yetkiniz yok')
  })
  it('beklenmeyen veritabanı detaylarını göstermez', async () => {
    mocks.rpc.mockResolvedValue({ error: { code: 'XX000', message: 'private details' } })
    await expect(deleteCustomer('16000000-0000-4000-8000-000000000001')).rejects.toThrow('Müşteri silinemedi')
  })
})
