import { createNotificationServices } from './notification.service.ts'

const config = {
  url: 'https://example.supabase.co', serviceKey: 'test-service-key',
  resendKey: 'test-resend-key', from: 'test@example.test', appUrl: 'https://example.test',
}
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

Deno.test('provider retries preserve idempotency key and exact payload without sending real email', async () => {
  const original = globalThis.fetch
  const calls: { key: string | null; body: string }[] = []
  globalThis.fetch = async (input, init) => {
    assert(String(input) === 'https://api.resend.com/emails', 'Unexpected network endpoint')
    calls.push({ key: new Headers(init?.headers).get('Idempotency-Key'), body: String(init?.body) })
    return new Response('{"id":"test"}', { status: 200 })
  }
  try {
    const service = createNotificationServices(config)
    const body = { to: 'owner@example.test', html: 'fixed content' }
    const results = await Promise.all([service.send('reservation-test', body), service.send('reservation-test', body)])
    assert(results.every(Boolean), 'Both provider responses should succeed')
    assert(calls.length === 2, 'Two HTTP attempts expected')
    assert(calls[0].key === 'reservation-pending/reservation-test', 'Stable event key required')
    assert(calls[0].key === calls[1].key && calls[0].body === calls[1].body, 'Retries must be identical')
  } finally { globalThis.fetch = original }
})

Deno.test('provider rejection is not treated as delivery success', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async () => new Response('private-provider-error', { status: 409 })
  try {
    assert(await createNotificationServices(config).send('test', {}) === false, 'Rejection must fail')
  } finally { globalThis.fetch = original }
})

Deno.test('duplicate claim uses existing frozen content', async () => {
  const original = globalThis.fetch
  const saved = { owner_id: 'owner', request_body: { html: 'original' }, started_at: new Date().toISOString(), sent_at: null }
  const methods: string[] = []
  globalThis.fetch = async (input, init) => {
    assert(String(input).includes('/rest/v1/reservation_notification_deliveries'), 'Unexpected endpoint')
    const method = init?.method ?? 'GET'
    methods.push(method)
    if (method === 'POST') {
      assert(new Headers(init?.headers).get('Prefer')?.includes('resolution=ignore-duplicates'), 'Existing content must not be overwritten')
      return new Response(null, { status: 201 })
    }
    return new Response(JSON.stringify(saved), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
  try {
    const row = await createNotificationServices(config).claim('reservation', 'owner', { html: 'changed' })
    assert(row.request_body?.html === 'original', 'Retry must use frozen body')
    assert(methods.join(',') === 'POST,GET', 'Claim before read required')
  } finally { globalThis.fetch = original }
})
