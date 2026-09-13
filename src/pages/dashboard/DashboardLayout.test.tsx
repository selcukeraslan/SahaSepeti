import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
const mocks = vi.hoisted(() => ({ access: vi.fn(), auth: vi.fn() }))
vi.mock('@/features/auth/hooks/useAuth', () => ({ useAuth: mocks.auth }))
vi.mock('@/features/staff/hooks/usePanelAccess', () => ({ usePanelAccess: mocks.access }))
import { DashboardLayout } from './DashboardLayout'

function render() {
  return renderToStaticMarkup(<MemoryRouter initialEntries={['/panel/takvim']}><DashboardLayout /></MemoryRouter>)
}
describe('scoped panel navigation', () => {
  beforeEach(() => { mocks.auth.mockReturnValue({ profile: { role: 'customer' } }) })
  it('viewer sees only calendar navigation', () => {
    mocks.access.mockReturnValue({ data: [{ id: 'venue', name: 'Test Tesis', role: 'viewer' }] })
    const html = render()
    expect(html).toContain('Görüntüleyici')
    expect(html).toContain('Takvim')
    for (const label of ['Personel','Müşteriler','Rezervasyonlar','Tesislerim','İstatistik']) expect(html).not.toContain(label)
  })
  it('reception sees operational screens but not privileged screens', () => {
    mocks.access.mockReturnValue({ data: [{ id: 'venue', name: 'Test Tesis', role: 'reception' }] })
    const html = render()
    expect(html).toContain('Müşteriler')
    expect(html).toContain('Rezervasyonlar')
    for (const label of ['Personel','Tesislerim','İstatistik']) expect(html).not.toContain(label)
  })
  it('manager sees staff and venue management', () => {
    mocks.access.mockReturnValue({ data: [{ id: 'venue', name: 'Test Tesis', role: 'manager' }] })
    const html = render()
    expect(html).toContain('Personel')
    expect(html).toContain('Tesislerim')
    expect(html).toContain('Çalışılan tesis')
  })
  it('failed permission refresh hides the panel even when cached data exists', () => {
    mocks.access.mockReturnValue({ isError: true, data: [{ id: 'venue', name: 'Test Tesis', role: 'manager' }] })
    const html = render()
    expect(html).toContain('Panel yetkileri yüklenemedi')
    expect(html).not.toContain('Personel')
  })
})
