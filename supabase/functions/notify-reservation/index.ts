// SahaSepeti — Rezervasyon bildirimi (Supabase Edge Function, Deno)
//
// Yeni bir rezervasyon "pending" (onay bekliyor) olarak oluşturulduğunda,
// tesis sahibine e-posta gönderir. Supabase Database Webhook (reservations
// INSERT) tarafından tetiklenir. Kurulum için README.md'ye bakın.
//
// KVKK: yalnızca gerekli alanlar işlenir; e-posta gövdesine müşteri e-postası/
// telefonu yazılmaz, loglara kişisel veri düşmez.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface ReservationRecord {
  id: string
  venue_id: string
  court_id: string
  customer_id: string
  reservation_date: string
  start_time: string
  end_time: string
  total_price: number
  status: string
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: ReservationRecord | null
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = Deno.env.get('NOTIFY_FROM_EMAIL') ?? 'SahaSepeti <onboarding@resend.dev>'
const APP_URL = Deno.env.get('APP_URL') ?? ''
const WEBHOOK_SECRET = Deno.env.get('NOTIFY_WEBHOOK_SECRET') // opsiyonel ek güvenlik
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const tryFormatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  maximumFractionDigits: 0,
})

/** "2026-07-12" → "12.07.2026" (saat dilimi tuzağı olmadan) */
function formatDate(ymd: string): string {
  const [year, month, day] = ymd.split('-')
  return `${day}.${month}.${year}`
}

/** Kullanıcı/tesis kaynaklı metinlerin e-posta HTML yapısını bozmasını önler. */
function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character] ?? character,
  )
}

function renderEmail(input: {
  ownerName: string
  venueName: string
  courtName: string
  date: string
  start: string
  end: string
  price: number
  panelUrl: string
}): string {
  const priceText = tryFormatter.format(input.price)
  const ownerName = escapeHtml(input.ownerName)
  const venueName = escapeHtml(input.venueName)
  const courtName = escapeHtml(input.courtName)
  const panelUrl = escapeHtml(input.panelUrl)
  const cta = input.panelUrl
    ? `<a href="${panelUrl}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:12px">Rezervasyonu Görüntüle</a>`
    : ''
  return `<!doctype html>
<html lang="tr"><body style="margin:0;background:#f1f5f4;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a">
  <div style="max-width:520px;margin:0 auto;padding:24px">
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(15,23,42,.06)">
      <div style="background:#059669;padding:20px 24px">
        <span style="color:#ffffff;font-size:18px;font-weight:700">SahaSepeti</span>
      </div>
      <div style="padding:24px">
        <h1 style="margin:0 0 4px;font-size:18px">Yeni rezervasyon onayı bekliyor</h1>
        <p style="margin:0 0 20px;color:#475569;font-size:14px">
          Merhaba ${ownerName}, <strong>${venueName}</strong> için yeni bir rezervasyon talebi var.
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:8px 0;color:#64748b">Saha</td><td style="padding:8px 0;text-align:right;font-weight:600">${courtName}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Tarih</td><td style="padding:8px 0;text-align:right;font-weight:600">${formatDate(input.date)}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Saat</td><td style="padding:8px 0;text-align:right;font-weight:600">${input.start} – ${input.end}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Tutar</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#059669">${priceText}</td></tr>
        </table>
        <div style="margin-top:24px">${cta}</div>
        <p style="margin:24px 0 0;color:#94a3b8;font-size:12px">
          Bu rezervasyon onayınızı bekliyor. Panelinizden onaylayabilir veya reddedebilirsiniz.
        </p>
      </div>
    </div>
  </div>
</body></html>`
}

Deno.serve(async (req) => {
  // Opsiyonel paylaşılan secret doğrulaması
  if (WEBHOOK_SECRET && req.headers.get('x-webhook-secret') !== WEBHOOK_SECRET) {
    return new Response('unauthorized', { status: 401 })
  }
  if (!RESEND_API_KEY || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Eksik yapılandırma: RESEND_API_KEY / SUPABASE_URL / SERVICE_ROLE_KEY')
    return new Response('config error', { status: 500 })
  }

  let payload: WebhookPayload
  try {
    payload = await req.json()
  } catch {
    return new Response('bad request', { status: 400 })
  }

  const record = payload.record
  // Yalnızca yeni ve onay bekleyen (pending) rezervasyonlar için mail
  if (!record || record.status !== 'pending') {
    return new Response(JSON.stringify({ skipped: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  // Tesis + sahip
  const { data: venue, error: venueError } = await admin
    .from('venues')
    .select('name, owner_id')
    .eq('id', record.venue_id)
    .single()
  if (venueError || !venue) {
    console.error('Tesis bulunamadı:', venueError?.message)
    return new Response('venue not found', { status: 200 }) // webhook yeniden denemesin
  }

  // Tesis sahibinin e-postası (auth.users — service role ile)
  const { data: ownerData, error: ownerError } = await admin.auth.admin.getUserById(venue.owner_id)
  const ownerEmail = ownerData?.user?.email
  if (ownerError || !ownerEmail) {
    console.error('Sahip e-postası bulunamadı:', ownerError?.message)
    return new Response('owner email not found', { status: 200 })
  }

  // İsim + saha adı (e-postayı zenginleştirir; hata olsa da devam)
  const [{ data: ownerProfile }, { data: court }] = await Promise.all([
    admin.from('profiles').select('full_name').eq('id', venue.owner_id).single(),
    admin.from('courts').select('name').eq('id', record.court_id).single(),
  ])

  const html = renderEmail({
    ownerName: ownerProfile?.full_name ?? 'Tesis Sahibi',
    venueName: venue.name,
    courtName: court?.name ?? 'Saha',
    date: record.reservation_date,
    start: record.start_time.slice(0, 5),
    end: record.end_time.slice(0, 5),
    price: record.total_price,
    panelUrl: APP_URL ? `${APP_URL.replace(/\/$/, '')}/panel/rezervasyonlar` : '',
  })

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: ownerEmail,
      subject: `Yeni rezervasyon onayı bekliyor — ${venue.name}`,
      html,
    }),
  })

  if (!emailRes.ok) {
    const detail = await emailRes.text()
    console.error('Resend hatası:', emailRes.status, detail)
    return new Response('email send failed', { status: 500 })
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
