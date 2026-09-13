import { createNotificationHandler } from './handler.ts'
import { createNotificationServices } from './notification.service.ts'

const secret = Deno.env.get('NOTIFY_WEBHOOK_SECRET') ?? ''
const url = Deno.env.get('SUPABASE_URL') ?? ''
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const resendKey = Deno.env.get('RESEND_API_KEY') ?? ''
const from = Deno.env.get('NOTIFY_FROM_EMAIL') ?? ''
const appUrl = Deno.env.get('APP_URL') ?? ''
let validAppUrl = false
try { validAppUrl = new URL(appUrl).protocol === 'https:' } catch { /* fail closed */ }
const configured = Boolean(url && serviceKey && resendKey && from && validAppUrl && secret.length >= 32)

// Do not construct the privileged client when configuration is missing.
if (!configured) {
  Deno.serve(() => new Response('not configured', { status: 503 }))
} else {
  Deno.serve(createNotificationHandler({
    secret, configured, now: Date.now,
    ...createNotificationServices({ url, serviceKey, resendKey, from, appUrl }),
  }))
}
