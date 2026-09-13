import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createNotificationHandler, type NotificationDependencies, type CanonicalReservation } from '../../../../supabase/functions/notify-reservation/handler'

const secret = 's'.repeat(40)
const id = '20000000-0000-4000-8000-000000000001'
const canonical: CanonicalReservation = {
  id, venue_id: id, court_id: id, customer_id: id, status: 'pending', source: 'marketplace',
  is_block: false, reservation_date: '2026-09-20', start_time: '20:00', end_time: '21:00', total_price: 1000,
}
const payload = { type: 'INSERT', schema: 'public', table: 'reservations', record: canonical }
const now = Date.parse('2026-09-13T12:00:00Z')
const frozenBody = { to: 'owner@example.test', html: 'Frozen content' }
const row = { owner_id: id, request_body: frozenBody, started_at: new Date(now).toISOString(), sent_at: null }
let deps: NotificationDependencies
function request(body: unknown = payload, token = secret) {
  return new Request('https://example.test/notify', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-webhook-secret': token },
    body: JSON.stringify(body),
  })
}
describe('reservation notification safety', () => {
  beforeEach(() => {
    deps = {
      secret, configured: true, now: () => now,
      reservation: vi.fn().mockResolvedValue(canonical),
      prepare: vi.fn().mockResolvedValue({ ownerId: id, body: { html: 'New content' } }),
      claim: vi.fn().mockResolvedValue(row), send: vi.fn().mockResolvedValue(true),
      markSent: vi.fn().mockResolvedValue(undefined),
    }
  })
  it('eksik secret ile kapalı kalır', async () => {
    deps.secret = ''
    expect((await createNotificationHandler(deps)(request())).status).toBe(503)
    expect(deps.reservation).not.toHaveBeenCalled()
  })
  it('yanlış secret veritabanına erişemez', async () => {
    expect((await createNotificationHandler(deps)(request(payload, 'bad'))).status).toBe(401)
    expect(deps.send).not.toHaveBeenCalled()
  })
  it.each([null, {}, { ...payload, type: 'UPDATE' }, { ...payload, table: 'venues' },
    { ...payload, schema: 'private' }, { ...payload, record: { ...canonical, id: 'bad' } }])(
    'bozuk olay reddedilir', async (body) => {
      expect((await createNotificationHandler(deps)(request(body))).status).toBe(400)
      expect(deps.reservation).not.toHaveBeenCalled()
    },
  )
  it('büyük gövde reddedilir', async () => {
    expect((await createNotificationHandler(deps)(request({ padding: 'x'.repeat(17000) }))).status).toBe(400)
  })
  it('rezervasyon eşleşmeyince göndermez', async () => {
    vi.mocked(deps.reservation).mockResolvedValue({ ...canonical, venue_id: 'other' })
    expect((await createNotificationHandler(deps)(request())).status).toBe(400)
    expect(deps.send).not.toHaveBeenCalled()
  })
  it('iptal edilmiş kayıt atlanır', async () => {
    vi.mocked(deps.reservation).mockResolvedValue({ ...canonical, status: 'cancelled' })
    await createNotificationHandler(deps)(request())
    expect(deps.prepare).not.toHaveBeenCalled()
  })
  it('sahte fiyatı değil DB kaydını ve saklanan gövdeyi kullanır', async () => {
    expect((await createNotificationHandler(deps)(request({
      ...payload, record: { ...canonical, total_price: 1 },
    }))).status).toBe(200)
    expect(deps.prepare).toHaveBeenCalledWith(canonical)
    expect(deps.send).toHaveBeenCalledWith(id, frozenBody)
    expect(deps.markSent).toHaveBeenCalledWith(id)
  })
  it('gönderilmiş kayıt tekrar gönderilmez', async () => {
    vi.mocked(deps.claim).mockResolvedValue({ ...row, sent_at: new Date(now).toISOString() })
    await createNotificationHandler(deps)(request())
    expect(deps.send).not.toHaveBeenCalled()
  })
  it('belirsiz eski gönderim otomatik tekrarlanmaz', async () => {
    vi.mocked(deps.claim).mockResolvedValue({ ...row, started_at: new Date(now - 23 * 3600000).toISOString() })
    expect((await createNotificationHandler(deps)(request())).status).toBe(409)
    expect(deps.send).not.toHaveBeenCalled()
  })
  it('sağlayıcı hatası başarı olarak işaretlenmez', async () => {
    vi.mocked(deps.send).mockResolvedValue(false)
    expect((await createNotificationHandler(deps)(request())).status).toBe(503)
    expect(deps.markSent).not.toHaveBeenCalled()
  })
  it('hata detayları dışarı sızmaz', async () => {
    vi.mocked(deps.send).mockRejectedValue(new Error('owner@example.test SECRET'))
    const result = await createNotificationHandler(deps)(request())
    expect(await result.text()).not.toContain('SECRET')
  })
  it('gönderim öncesi iptali tekrar kontrol eder', async () => {
    vi.mocked(deps.reservation).mockResolvedValueOnce(canonical).mockResolvedValueOnce({ ...canonical, status: 'cancelled' })
    await createNotificationHandler(deps)(request())
    expect(deps.send).not.toHaveBeenCalled()
  })
})
