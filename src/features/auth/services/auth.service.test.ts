import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthStateChangeHandler } from './auth.service'

const authMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  unsubscribe: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: authMocks.getSession,
      onAuthStateChange: authMocks.onAuthStateChange,
    },
  },
}))

import { getCurrentSession, subscribeToAuthChanges } from './auth.service'

describe('auth session service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mevcut oturumu döndürür', async () => {
    const session = { access_token: 'test-token' }
    authMocks.getSession.mockResolvedValue({ data: { session }, error: null })

    await expect(getCurrentSession()).resolves.toBe(session)
  })

  it('oturum okunamadığında kullanıcı dostu hata verir', async () => {
    authMocks.getSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'storage unavailable' },
    })

    await expect(getCurrentSession()).rejects.toThrow('Oturum bilgisi alınamadı')
  })

  it('auth değişiklik aboneliğini temizleyen fonksiyon döndürür', () => {
    authMocks.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: authMocks.unsubscribe } },
    })
    const handler = vi.fn() as AuthStateChangeHandler

    const unsubscribe = subscribeToAuthChanges(handler)

    expect(authMocks.onAuthStateChange).toHaveBeenCalledWith(handler)
    unsubscribe()
    expect(authMocks.unsubscribe).toHaveBeenCalledOnce()
  })
})
