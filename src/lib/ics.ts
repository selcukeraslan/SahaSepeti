/** Takvim (ICS) üretimi — saf fonksiyonlar (test edilebilir). */

export interface ReservationIcsInput {
  /** Benzersiz kimlik (rezervasyon id) */
  uid: string
  title: string
  description?: string
  location?: string
  /** yyyy-MM-dd (İstanbul günü) */
  date: string
  /** HH:mm */
  startTime: string
  /** HH:mm */
  endTime: string
}

/** Date → ICS UTC damgası: "20260720T170000Z" */
function utcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

/**
 * İstanbul yerel tarih+saatini UTC ICS damgasına çevirir.
 * Türkiye 2016'dan beri sabit UTC+3 (DST yok) — güvenle -3 saat kaydırılır.
 */
export function istanbulToUtcStamp(dateYmd: string, time: string): string {
  const [year = 0, month = 1, day = 1] = dateYmd.split('-').map(Number)
  const [hour = 0, minute = 0] = time.split(':').map(Number)
  // Date.UTC negatif/taşan saatleri (örn. 02:00 - 3 = önceki gün 23:00) kendisi devirir
  return utcStamp(new Date(Date.UTC(year, month - 1, day, hour - 3, minute)))
}

/** ICS metin alanı kaçışları (RFC 5545): \ ; , ve satır sonları */
export function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/** Rezervasyon için indirilebilir .ics içeriği üretir (CRLF satır sonları). */
export function buildReservationIcs(input: ReservationIcsInput, now: Date = new Date()): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SahaSepeti//Rezervasyon//TR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${input.uid}@sahasepeti`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART:${istanbulToUtcStamp(input.date, input.startTime)}`,
    `DTEND:${istanbulToUtcStamp(input.date, input.endTime)}`,
    `SUMMARY:${escapeIcsText(input.title)}`,
    ...(input.location ? [`LOCATION:${escapeIcsText(input.location)}`] : []),
    ...(input.description ? [`DESCRIPTION:${escapeIcsText(input.description)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.join('\r\n') + '\r\n'
}

/** Google Takvim "etkinlik ekle" bağlantısı (Android/Gmail kullanıcıları için). */
export function googleCalendarUrl(input: ReservationIcsInput): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: input.title,
    dates: `${istanbulToUtcStamp(input.date, input.startTime)}/${istanbulToUtcStamp(input.date, input.endTime)}`,
  })
  if (input.location) params.set('location', input.location)
  if (input.description) params.set('details', input.description)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
