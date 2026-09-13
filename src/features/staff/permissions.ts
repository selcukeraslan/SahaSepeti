import type { StaffRole } from '@/types/database.types'
import { STAFF_PERMISSIONS } from './schemas'

export type PanelRole = StaffRole | 'owner' | 'admin'
export type Permission = typeof STAFF_PERMISSIONS.manager[number]
export function can(role: PanelRole | undefined, permission: Permission): boolean {
  if (!role) return false
  return role === 'owner' || role === 'admin' || (STAFF_PERMISSIONS[role] as readonly string[]).includes(permission)
}
export function routePermission(path: string): Permission {
  if (path.startsWith('/panel/personel')) return 'staff.manage'
  if (path.startsWith('/panel/tesisler')) return 'venue.write'
  if (path.startsWith('/panel/musteriler')) return 'customers.read'
  if (path.startsWith('/panel/rezervasyonlar')) return 'reservations.write'
  if (path.startsWith('/panel/takvim')) return 'calendar.read'
  return 'reports.read'
}
export const PANEL_ROLE_LABELS = { owner: 'Tesis Sahibi', admin: 'Admin', manager: 'Yönetici', reception: 'Resepsiyon', viewer: 'Görüntüleyici' }
export const ROLE_DESCRIPTIONS = {
  manager: 'Takvim, rezervasyon, müşteri, rapor ve tesis/fiyat yönetimi. Resepsiyon ve görüntüleyici personeli yönetebilir.',
  reception: 'Takvim, rezervasyon ve müşteri işlemleri. Tesis/fiyat ve personel yönetimi yapamaz.',
  viewer: 'Yalnızca takvim doluluğunu görür. Kişisel bilgileri göremez ve işlem yapamaz.',
}
