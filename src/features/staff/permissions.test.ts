import { describe, expect, it } from 'vitest'
import { can, routePermission, type PanelRole, type Permission } from './permissions'

describe('panel permission matrix', () => {
  const permissions: Permission[] = ['calendar.read','reservations.write','customers.read','customers.write','reports.read','venue.write','staff.manage']
  it.each<PanelRole>(['owner','admin','manager'])('%s can access the full scoped panel', role => {
    for (const permission of permissions) expect(can(role, permission)).toBe(true)
  })
  it('viewer has no write/customer/report access', () => {
    expect(permissions.filter(permission => can('viewer', permission))).toEqual(['calendar.read'])
  })
  it('reception cannot manage venue, personnel or reports', () => {
    expect(permissions.filter(permission => can('reception', permission))).toEqual(permissions.slice(0,4))
  })
  it('unknown membership is denied', () => {
    for (const permission of permissions) expect(can(undefined, permission)).toBe(false)
  })
  it.each([
    ['/panel','reports.read'], ['/panel/istatistik','reports.read'], ['/panel/takvim','calendar.read'],
    ['/panel/rezervasyonlar','reservations.write'], ['/panel/musteriler','customers.read'],
    ['/panel/personel','staff.manage'], ['/panel/tesisler','venue.write'], ['/panel/tesisler/id','venue.write'],
  ])('guards %s by %s', (path, permission) => { expect(routePermission(path)).toBe(permission) })
})
