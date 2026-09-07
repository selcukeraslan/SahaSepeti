import { describe, expect, it } from 'vitest'
import { customerSearchSchema, saveCustomerSchema } from './customers.schemas'

const id = '16000000-0000-4000-8000-000000000001'
describe('customer schemas', () => {
  it('yeni kayıtta korumalı profil ve kara liste alanlarını kabul etmez', () => {
    const value = saveCustomerSchema.parse({ action: 'create', venueId: id, name: ' Test Müşteri ',
      phone: '0555 123 45 67', profile_id: id, is_blacklisted: true })
    expect(value).not.toHaveProperty('profile_id')
    expect(value).not.toHaveProperty('is_blacklisted')
    expect(value).toHaveProperty('name', 'Test Müşteri')
  })
  it.each([true, false])('kara liste ekleme/çıkarma gerekçesini zorunlu tutar: %s', (blocked) => {
    expect(saveCustomerSchema.safeParse({ action: 'blacklist', id, blocked, reason: '  ' }).success).toBe(false)
    expect(saveCustomerSchema.safeParse({ action: 'blacklist', id, blocked, reason: 'Owner onayı' }).success).toBe(true)
  })
  it('arama sınırlarını ve tesis kimliğini doğrular', () => {
    const input = { venueId: id, query: '4567', filter: 'no_show', limit: 25, offset: 0 }
    expect(customerSearchSchema.safeParse(input).success).toBe(true)
    expect(customerSearchSchema.safeParse({ ...input, limit: 1000 }).success).toBe(false)
    expect(customerSearchSchema.safeParse({ ...input, offset: -1 }).success).toBe(false)
    expect(customerSearchSchema.safeParse({ ...input, venueId: '' }).success).toBe(false)
  })
  it('aşırı uzun notu reddeder', () => {
    expect(saveCustomerSchema.safeParse({ action: 'notes', id, notes: 'x'.repeat(1001) }).success).toBe(false)
  })
})
