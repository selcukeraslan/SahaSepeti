import { describe, expect, it } from 'vitest'
import {
  buildReservationIcs,
  escapeIcsText,
  googleCalendarUrl,
  istanbulToUtcStamp,
} from './ics'

describe('istanbulToUtcStamp', () => {
  it('İstanbul saatini UTC damgasına çevirir (sabit +3)', () => {
    expect(istanbulToUtcStamp('2026-07-20', '20:00')).toBe('20260720T170000Z')
    expect(istanbulToUtcStamp('2026-07-20', '09:30')).toBe('20260720T063000Z')
  })

  it('gece yarısına yakın saatlerde günü doğru devirir', () => {
    // İstanbul 01:00 = önceki gün 22:00 UTC
    expect(istanbulToUtcStamp('2026-07-20', '01:00')).toBe('20260719T220000Z')
  })
})

describe('escapeIcsText', () => {
  it('özel karakterleri RFC 5545 kurallarına göre kaçışlar', () => {
    expect(escapeIcsText('Saha 1; Kadıköy, İstanbul')).toBe('Saha 1\\; Kadıköy\\, İstanbul')
    expect(escapeIcsText('satır\nsonu')).toBe('satır\\nsonu')
    expect(escapeIcsText('ters\\bölü')).toBe('ters\\\\bölü')
  })
})

describe('buildReservationIcs', () => {
  const input = {
    uid: 'res-123',
    title: 'Yeşilvadi — Saha 1 rezervasyonu',
    location: 'Yeşilvadi, Kadıköy/İstanbul',
    date: '2026-07-20',
    startTime: '20:00',
    endTime: '21:00',
  }
  const NOW = new Date('2026-07-13T12:00:00Z')

  it('geçerli VCALENDAR yapısı üretir (CRLF, UID, DTSTART/DTEND)', () => {
    const ics = buildReservationIcs(input, NOW)
    expect(ics).toContain('BEGIN:VCALENDAR\r\n')
    expect(ics).toContain('UID:res-123@sahasepeti\r\n')
    expect(ics).toContain('DTSTAMP:20260713T120000Z\r\n')
    expect(ics).toContain('DTSTART:20260720T170000Z\r\n')
    expect(ics).toContain('DTEND:20260720T180000Z\r\n')
    expect(ics).toContain('LOCATION:Yeşilvadi\\, Kadıköy/İstanbul\r\n')
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
  })

  it('opsiyonel alanlar yoksa satırları üretmez', () => {
    const ics = buildReservationIcs({ ...input, location: undefined }, NOW)
    expect(ics).not.toContain('LOCATION:')
    expect(ics).not.toContain('DESCRIPTION:')
  })
})

describe('googleCalendarUrl', () => {
  it('doğru dates aralığı ve başlıkla link üretir', () => {
    const url = googleCalendarUrl({
      uid: 'x',
      title: 'Maç',
      date: '2026-07-20',
      startTime: '20:00',
      endTime: '21:00',
    })
    expect(url).toContain('https://calendar.google.com/calendar/render?')
    expect(url).toContain('action=TEMPLATE')
    expect(url).toContain('dates=20260720T170000Z%2F20260720T180000Z')
    expect(url).toContain('text=Ma%C3%A7')
  })
})
