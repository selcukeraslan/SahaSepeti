export interface EventRecord {
  id: string; venue_id: string; court_id: string; customer_id: string
}
export interface CanonicalReservation extends EventRecord {
  status: string; source: string; is_block: boolean
  reservation_date: string; start_time: string; end_time: string; total_price: number
}
export interface Delivery {
  owner_id: string; request_body: Record<string, unknown> | null
  started_at: string; sent_at: string | null
}
export interface NotificationDependencies {
  secret: string
  configured: boolean
  now: () => number
  reservation: (id: string) => Promise<CanonicalReservation | null>
  prepare: (record: CanonicalReservation) => Promise<{ ownerId: string; body: Record<string, unknown> }>
  claim: (id: string, ownerId: string, body: Record<string, unknown>) => Promise<Delivery>
  send: (id: string, body: Record<string, unknown>) => Promise<boolean>
  markSent: (id: string) => Promise<void>
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
export function parseEvent(value: unknown): EventRecord | null {
  if (!object(value) || value.type !== 'INSERT' || value.schema !== 'public' || value.table !== 'reservations'
    || !object(value.record)) return null
  const record = value.record
  if (!['id', 'venue_id', 'court_id', 'customer_id'].every(
    (key) => typeof record[key] === 'string' && uuidPattern.test(record[key]),
  )) return null
  return {
    id: record.id as string, venue_id: record.venue_id as string,
    court_id: record.court_id as string, customer_id: record.customer_id as string,
  }
}
function matches(event: EventRecord, record: CanonicalReservation) {
  return event.id === record.id && event.venue_id === record.venue_id
    && event.court_id === record.court_id && event.customer_id === record.customer_id
}
function sameSecret(actual: string, expected: string) {
  let difference = actual.length ^ expected.length
  for (let i = 0; i < expected.length; i++) difference |= (actual.charCodeAt(i) || 0) ^ expected.charCodeAt(i)
  return difference === 0
}
async function readPayload(req: Request): Promise<unknown> {
  const reader = req.body?.getReader()
  if (!reader) throw new Error('empty')
  let size = 0
  const decoder = new TextDecoder()
  let body = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 16384) { await reader.cancel(); throw new Error('size') }
      body += decoder.decode(value, { stream: true })
    }
    return JSON.parse(body + decoder.decode())
  } finally {
    reader.releaseLock()
  }
}
const response = (status: number, result: string) => new Response(JSON.stringify({ result }), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
})

export function createNotificationHandler(deps: NotificationDependencies) {
  return async (req: Request): Promise<Response> => {
    if (req.method !== 'POST') return response(405, 'method_not_allowed')
    if (!deps.configured || deps.secret.length < 32) return response(503, 'not_configured')
    if (!sameSecret(req.headers.get('x-webhook-secret') ?? '', deps.secret)) return response(401, 'unauthorized')
    if (req.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json') {
      return response(415, 'json_required')
    }
    let payload: unknown
    try { payload = await readPayload(req) } catch { return response(400, 'invalid_payload') }
    // Valid non-marketplace inserts need no notification (manual/block inserts have no customer).
    if (object(payload) && payload.type === 'INSERT' && payload.schema === 'public'
      && payload.table === 'reservations' && object(payload.record)
      && payload.record.customer_id === null) return response(200, 'skipped')
    const event = parseEvent(payload)
    if (!event) return response(400, 'invalid_event')
    try {
      const record = await deps.reservation(event.id)
      if (!record) return response(200, 'skipped')
      if (!matches(event, record)) return response(400, 'reservation_mismatch')
      if (record.status !== 'pending' || record.source !== 'marketplace' || record.is_block) {
        return response(200, 'skipped')
      }
      const prepared = await deps.prepare(record)
      const delivery = await deps.claim(record.id, prepared.ownerId, prepared.body)
      if (delivery.sent_at) return response(200, 'already_sent')
      if (delivery.owner_id !== prepared.ownerId) return response(409, 'owner_changed')
      const age = deps.now() - Date.parse(delivery.started_at)
      // Resend keys expire after 24h. Fail closed before that deadline when outcome is unknown.
      if (!Number.isFinite(age) || age < 0 || age >= 23 * 60 * 60 * 1000) {
        return response(409, 'manual_review_required')
      }
      if (!delivery.request_body) return response(503, 'delivery_unavailable')
      // Recheck status immediately before send; do not email an already cancelled request.
      const latest = await deps.reservation(record.id)
      if (!latest || !matches(event, latest) || latest.status !== 'pending') return response(200, 'skipped')
      if (!await deps.send(record.id, delivery.request_body)) return response(503, 'send_failed')
      await deps.markSent(record.id)
      return response(200, 'sent')
    } catch {
      // Never log provider bodies, owner email or service-role credentials.
      return response(503, 'notification_failed')
    }
  }
}
