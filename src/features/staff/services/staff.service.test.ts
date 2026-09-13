import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ rpc: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { rpc: mocks.rpc } }))
import { acceptStaffInvite, manageStaff } from './staff.service'
import { STAFF_PERMISSIONS, staffActionSchema } from '../schemas'

const venueId = '22000000-0000-4000-8000-000000000001'
const token = 'a'.repeat(64)
describe('staff invitation service', () => {
  beforeEach(() => vi.clearAllMocks())
  it('normalizes email before sending and validates the generated invitation', async () => {
    mocks.rpc.mockResolvedValue({ data: { id: venueId, token, expiresAt: '2026-09-20T12:00:00+00:00' }, error: null })
    expect(await manageStaff({ action: 'invite', venueId, role: 'viewer', email: ' Test@Example.com ' })).toMatchObject({ token })
    expect(mocks.rpc).toHaveBeenCalledWith('manage_venue_staff', {
      p_input: { action: 'invite', venueId, role: 'viewer', email: 'test@example.com' },
    })
  })
  it('rejects unsupported roles and extra owner assignment fields', () => {
    expect(staffActionSchema.safeParse({ action: 'invite', venueId, email: 'a@b.com', role: 'admin' }).success).toBe(false)
    expect(staffActionSchema.safeParse({ action: 'remove', venueId, id: venueId, ownerId: venueId }).success).toBe(false)
  })
  it('does not call the API for malformed invitation tokens', async () => {
    await expect(acceptStaffInvite('invalid')).rejects.toThrow()
    expect(mocks.rpc).not.toHaveBeenCalled()
  })
  it('accepts the invitation through the server without changing profile role', async () => {
    mocks.rpc.mockResolvedValue({ data: venueId, error: null })
    expect(await acceptStaffInvite(token)).toBe(venueId)
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith('accept_staff_invite', { p_token: token })
  })
  it('does not retry rejected invitations', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: 'P0001', message: 'Davet geçersiz veya süresi dolmuş' } })
    await expect(acceptStaffInvite(token)).rejects.toThrow('Davet geçersiz veya süresi dolmuş')
    expect(mocks.rpc).toHaveBeenCalledTimes(1)
  })
  it('does not expose infrastructure errors', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: 'XX000', message: 'internal detail' } })
    await expect(manageStaff({ action: 'remove', venueId, id: venueId })).rejects.toThrow('Personel işlemi tamamlanamadı')
  })
  it('rejects a false success result', async () => {
    mocks.rpc.mockResolvedValue({ data: { success: false }, error: null })
    await expect(manageStaff({ action: 'remove', venueId, id: venueId })).rejects.toThrow()
  })
  it('viewer and reception UI permissions cannot suggest privileged writes', () => {
    expect(STAFF_PERMISSIONS.viewer).toEqual(['calendar.read'])
    expect(STAFF_PERMISSIONS.reception).not.toContain('venue.write')
    expect(STAFF_PERMISSIONS.reception).not.toContain('staff.manage')
    expect(STAFF_PERMISSIONS.manager).toContain('staff.manage')
  })
})
