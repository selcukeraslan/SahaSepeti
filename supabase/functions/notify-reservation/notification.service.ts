import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.110.1'
import type { CanonicalReservation, Delivery, NotificationDependencies } from './handler.ts'
import { renderEmail } from './template.ts'

interface Configuration {
  url: string; serviceKey: string; resendKey: string; from: string; appUrl: string
}

export function createNotificationServices(config: Configuration):
  Pick<NotificationDependencies, 'reservation' | 'prepare' | 'claim' | 'send' | 'markSent'> {
  const admin = createClient(config.url, config.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return {
    async reservation(id) {
      const { data, error } = await admin.from('reservations')
        .select('id,venue_id,court_id,customer_id,status,source,is_block,reservation_date,start_time,end_time,total_price')
        .eq('id', id).maybeSingle<CanonicalReservation>()
      if (error) throw new Error('reservation_lookup_failed')
      return data
    },
    async prepare(record) {
      const { data: venue, error } = await admin.from('venues').select('name,owner_id')
        .eq('id', record.venue_id).single<{ name: string; owner_id: string }>()
      if (error || !venue) throw new Error('venue_lookup_failed')
      const [owner, profile, court] = await Promise.all([
        admin.auth.admin.getUserById(venue.owner_id),
        admin.from('profiles').select('full_name').eq('id', venue.owner_id).single<{ full_name: string }>(),
        admin.from('courts').select('name').eq('id', record.court_id)
          .eq('venue_id', record.venue_id).single<{ name: string }>(),
      ])
      if (owner.error || !owner.data.user?.email || profile.error || court.error || !court.data) {
        throw new Error('recipient_lookup_failed')
      }
      return {
        ownerId: venue.owner_id,
        body: {
          from: config.from, to: owner.data.user.email,
          subject: `Yeni rezervasyon onayı bekliyor — ${venue.name}`,
          html: renderEmail({
            ownerName: profile.data?.full_name ?? 'Tesis Sahibi', venueName: venue.name,
            courtName: court.data.name, date: record.reservation_date,
            start: record.start_time.slice(0, 5), end: record.end_time.slice(0, 5), price: record.total_price,
            panelUrl: new URL('/panel/rezervasyonlar', config.appUrl).href,
          }),
        },
      }
    },
    async claim(id, ownerId, body) {
      const { error: insertError } = await admin.from('reservation_notification_deliveries')
        .upsert({ reservation_id: id, owner_id: ownerId, request_body: body }, {
          onConflict: 'reservation_id', ignoreDuplicates: true,
        })
      if (insertError) throw new Error('delivery_claim_failed')
      const { data, error } = await admin.from('reservation_notification_deliveries')
        .select('owner_id,request_body,started_at,sent_at').eq('reservation_id', id).single<Delivery>()
      if (error || !data) throw new Error('delivery_lookup_failed')
      return data
    },
    async send(id, body) {
      const result = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', Authorization: `Bearer ${config.resendKey}`,
          'Idempotency-Key': `reservation-pending/${id}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      })
      return result.ok
    },
    async markSent(id) {
      const { data, error } = await admin.from('reservation_notification_deliveries')
        .update({ sent_at: new Date().toISOString(), request_body: null })
        .eq('reservation_id', id).select('reservation_id')
      if (error || !data?.length) throw new Error('delivery_finalize_failed')
    },
  }
}
