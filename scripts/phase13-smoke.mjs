import { createClient } from '@supabase/supabase-js'
import { loadEnv } from 'vite'

const env = loadEnv('development', process.cwd(), 'VITE_')
const url = env.VITE_SUPABASE_URL
const key = env.VITE_SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error('Supabase ortam değişkenleri bulunamadı')
}

const accounts = [
  { label: 'customer', email: 'musteri@demo.sahasepeti.dev', expectedRole: 'customer' },
  { label: 'owner', email: 'owner@demo.sahasepeti.dev', expectedRole: 'venue_owner' },
  { label: 'admin', email: 'admin@demo.sahasepeti.dev', expectedRole: 'admin' },
]

async function verifyAccount(account) {
  const client = createClient(url, key, { auth: { persistSession: false } })
  const { data: auth, error: authError } = await client.auth.signInWithPassword({
    email: account.email,
    password: 'demo1234',
  })
  if (authError || !auth.user) {
    return { scenario: `${account.label} demo hesabı`, status: 'failed', detail: authError?.message ?? 'Kullanıcı bulunamadı' }
  }

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role')
    .eq('id', auth.user.id)
    .single()
  await client.auth.signOut()

  if (profileError) {
    return { scenario: `${account.label} profil erişimi`, status: 'failed', detail: profileError.message }
  }
  return profile.role === account.expectedRole
    ? { scenario: `${account.label} rolü`, status: 'passed', detail: profile.role }
    : { scenario: `${account.label} rolü`, status: 'failed', detail: `Beklenen ${account.expectedRole}, gelen ${profile.role}` }
}

const results = []
for (const account of accounts) results.push(await verifyAccount(account))

const anonymous = createClient(url, key, { auth: { persistSession: false } })
const { data: venues, error: venuesError } = await anonymous
  .from('venues')
  .select('id, courts(id), opening_hours(day_of_week), venue_sports(sport_id)')
  .eq('status', 'approved')
  .limit(5)

if (venuesError) {
  results.push({ scenario: 'public tesis erişimi', status: 'failed', detail: venuesError.message })
} else {
  const completeVenue = venues?.find(
    (venue) => venue.courts.length > 0 && venue.opening_hours.length > 0 && venue.venue_sports.length > 0,
  )
  results.push(
    completeVenue
      ? { scenario: 'public rezervasyona hazır tesis', status: 'passed', detail: completeVenue.id }
      : { scenario: 'public rezervasyona hazır tesis', status: 'failed', detail: 'Saha/saat/spor ilişkileri tam approved tesis bulunamadı' },
  )
}

const record = (scenario, passed, detail) => {
  results.push({ scenario, status: passed ? 'passed' : 'failed', detail })
  if (!passed) throw new Error(`${scenario}: ${detail}`)
}

async function signIn(email) {
  const client = createClient(url, key, { auth: { persistSession: false } })
  const { data, error } = await client.auth.signInWithPassword({ email, password: 'demo1234' })
  if (error || !data.user) throw new Error(error?.message ?? `${email} oturumu açılamadı`)
  return { client, user: data.user }
}

function istanbulDate(dayOffset) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(Date.now() + dayOffset * 86_400_000))
}

async function runWriteSmoke() {
  const marker = `PHASE13-E2E-${Date.now()}`
  const slug = marker.toLocaleLowerCase('tr-TR')
  let testVenueId = null
  let adminClient = null

  try {
    const ownerAuth = await signIn('owner@demo.sahasepeti.dev')
    const customerAuth = await signIn('musteri@demo.sahasepeti.dev')
    const adminAuth = await signIn('admin@demo.sahasepeti.dev')
    const owner = ownerAuth.client
    const customer = customerAuth.client
    const admin = adminAuth.client
    adminClient = admin

    const { data: sport, error: sportError } = await owner.from('sports').select('id').limit(1).single()
    if (sportError) throw sportError

    const { data: venue, error: venueError } = await owner
      .from('venues')
      .insert({
        owner_id: ownerAuth.user.id,
        name: marker,
        slug,
        description: 'Faz 13 uçtan uca regresyon testi — otomatik temizlenir.',
        city: 'İstanbul',
        district: 'Kadıköy',
        address: 'E2E test adresi',
        amenities: ['E2E Test'],
        status: 'draft',
      })
      .select('id, status')
      .single()
    if (venueError) throw venueError
    testVenueId = venue.id

    const { error: sportLinkError } = await owner
      .from('venue_sports')
      .insert({ venue_id: venue.id, sport_id: sport.id })
    if (sportLinkError) throw sportLinkError

    const { data: court, error: courtError } = await owner
      .from('courts')
      .insert({
        venue_id: venue.id,
        sport_id: sport.id,
        name: `${marker} Saha`,
        surface_type: 'E2E',
        is_indoor: true,
        capacity: 10,
      })
      .select('id')
      .single()
    if (courtError) throw courtError

    const { error: hoursError } = await owner.from('opening_hours').insert(
      Array.from({ length: 7 }, (_, day) => ({
        venue_id: venue.id,
        day_of_week: day,
        open_time: '09:00',
        close_time: '23:00',
        is_closed: false,
      })),
    )
    if (hoursError) throw hoursError

    const { error: priceError } = await owner.from('price_rules').insert({
      court_id: court.id,
      day_of_week: null,
      start_time: '09:00',
      end_time: '23:00',
      price: 1375,
    })
    if (priceError) throw priceError
    record('owner tesis/saha/saat/fiyat oluşturma', true, marker)

    const { data: hiddenDraft, error: hiddenDraftError } = await customer
      .from('venues')
      .select('id')
      .eq('id', venue.id)
    record('customer draft tesisi göremez', !hiddenDraftError && hiddenDraft.length === 0, hiddenDraftError?.message ?? `${hiddenDraft.length} kayıt`)

    const { error: submitError } = await owner.from('venues').update({ status: 'pending' }).eq('id', venue.id)
    if (submitError) throw submitError
    const { data: pendingVenue, error: pendingError } = await admin
      .from('venues')
      .select('id')
      .eq('id', venue.id)
      .eq('status', 'pending')
      .single()
    record('owner onaya gönderir, admin kuyrukta görür', !pendingError && pendingVenue.id === venue.id, pendingError?.message ?? pendingVenue.id)

    const { error: approveError } = await admin.from('venues').update({ status: 'approved' }).eq('id', venue.id)
    if (approveError) throw approveError
    const { data: publicVenue, error: publicError } = await anonymous
      .from('venues')
      .select('id')
      .eq('id', venue.id)
      .single()
    record('admin onayı sonrası tesis public görünür', !publicError && publicVenue.id === venue.id, publicError?.message ?? publicVenue.id)

    const futureDate = istanbulDate(7)
    const reservationInput = {
      court_id: court.id,
      venue_id: venue.id,
      customer_id: customerAuth.user.id,
      reservation_date: futureDate,
      start_time: '09:00',
      end_time: '10:00',
      notes: marker,
    }
    const { data: reservation, error: reservationError } = await customer
      .from('reservations')
      .insert(reservationInput)
      .select('id, status, total_price')
      .single()
    record('customer rezervasyon oluşturur', !reservationError && reservation.status === 'pending' && Number(reservation.total_price) === 1375, reservationError?.message ?? `${reservation.status}/${reservation.total_price}`)

    const { error: duplicateError } = await customer.from('reservations').insert(reservationInput)
    record('çift rezervasyon DB tarafından engellenir', duplicateError?.code === '23P01', duplicateError?.code ?? 'hata dönmedi')

    const { data: confirmed, error: confirmError } = await owner
      .from('reservations')
      .update({ status: 'confirmed' })
      .eq('id', reservation.id)
      .select('status')
      .single()
    record('owner rezervasyonu onaylar', !confirmError && confirmed.status === 'confirmed', confirmError?.message ?? confirmed.status)

    const { data: cancellable, error: cancellableError } = await customer
      .from('reservations')
      .insert({ ...reservationInput, start_time: '10:00', end_time: '11:00' })
      .select('id')
      .single()
    if (cancellableError) throw cancellableError
    const { data: cancelled, error: cancelError } = await customer
      .from('reservations')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancellation_reason: 'Faz 13 E2E iptal testi' })
      .eq('id', cancellable.id)
      .select('status, cancelled_at')
      .single()
    record('customer uygun rezervasyonu iptal eder', !cancelError && cancelled.status === 'cancelled' && Boolean(cancelled.cancelled_at), cancelError?.message ?? cancelled.status)

    const { error: backdateError } = await admin
      .from('reservations')
      .update({ reservation_date: istanbulDate(-1) })
      .eq('id', reservation.id)
    if (backdateError) throw backdateError
    const { data: noShow, error: noShowError } = await owner
      .from('reservations')
      .update({ no_show: true })
      .eq('id', reservation.id)
      .select('no_show')
      .single()
    record('owner başlamış rezervasyonu no-show işaretler', !noShowError && noShow.no_show, noShowError?.message ?? String(noShow.no_show))

    const { data: completed, error: completedError } = await owner
      .from('reservations')
      .update({ status: 'completed' })
      .eq('id', reservation.id)
      .select('status')
      .single()
    record('owner rezervasyonu tamamlar', !completedError && completed.status === 'completed', completedError?.message ?? completed.status)

    const { error: reviewError } = await customer.from('reviews').insert({
      venue_id: venue.id,
      customer_id: customerAuth.user.id,
      reservation_id: reservation.id,
      rating: 5,
      comment: marker,
    })
    if (reviewError) throw reviewError
    const { data: publicReviews, error: publicReviewsError } = await anonymous.rpc('get_venue_reviews', { p_venue_id: venue.id })
    record('tamamlanmış rezervasyon yorumu public RPC ile görünür', !publicReviewsError && publicReviews.some((review) => review.comment === marker), publicReviewsError?.message ?? `${publicReviews.length} yorum`)

    const { data: anonymousReservations, error: anonymousReservationsError } = await anonymous
      .from('reservations')
      .select('id')
      .eq('venue_id', venue.id)
    record('yetkisiz kullanıcı rezervasyon tablosunu okuyamaz', !anonymousReservationsError && anonymousReservations.length === 0, anonymousReservationsError?.message ?? `${anonymousReservations.length} kayıt`)

    const { error: transferError } = await admin
      .from('venues')
      .update({ owner_id: adminAuth.user.id })
      .eq('id', venue.id)
    if (transferError) throw transferError
    const { data: foreignUpdate, error: foreignUpdateError } = await owner
      .from('venues')
      .update({ name: `${marker}-YETKISIZ` })
      .eq('id', venue.id)
      .select('id')
    record('owner başka kullanıcıya ait tesisi değiştiremez', Boolean(foreignUpdateError) || foreignUpdate.length === 0, foreignUpdateError?.message ?? `${foreignUpdate.length} kayıt`)
  } finally {
    if (testVenueId && adminClient) {
      const { data: deleted, error: cleanupError } = await adminClient
        .from('venues')
        .delete()
        .eq('id', testVenueId)
        .select('id')
      const { data: remaining, error: verifyCleanupError } = await adminClient
        .from('venues')
        .select('id')
        .eq('id', testVenueId)
      const cleaned =
        !cleanupError &&
        !verifyCleanupError &&
        deleted.length === 1 &&
        remaining.length === 0
      record(
        'E2E test verisi temizliği',
        cleaned,
        cleanupError?.message ??
          verifyCleanupError?.message ??
          `${deleted.length} silindi, ${remaining.length} kaldı`,
      )
    }
  }
}

if (process.argv.includes('--write') && !results.some((result) => result.status === 'failed')) {
  try {
    await runWriteSmoke()
  } catch (error) {
    results.push({ scenario: 'yazmalı smoke akışı', status: 'failed', detail: error instanceof Error ? error.message : String(error) })
  }
}

console.log('\nÖZET')
for (const result of results) {
  console.log(`${result.status === 'passed' ? 'PASS' : 'FAIL'} | ${result.scenario} | ${result.detail}`)
}

if (results.some((result) => result.status === 'failed')) process.exitCode = 1
