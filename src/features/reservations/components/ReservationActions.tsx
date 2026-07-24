import { CalendarPlus, ExternalLink, Share2 } from 'lucide-react'
import { useToast } from '@/components/ui/useToast'
import { buildReservationIcs, googleCalendarUrl, type ReservationIcsInput } from '@/lib/ics'
import { formatDateLong, formatTime } from '@/lib/format'
import type { ReservationWithVenue } from '../types'

const ACTION_CLASS =
  'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-200'

/** Yaklaşan rezervasyon için takvime ekleme ve paylaşma kısayolları. */
export function ReservationActions({ reservation }: { reservation: ReservationWithVenue }) {
  const { toast } = useToast()

  const venueName = reservation.venue?.name ?? 'Tesis'
  const courtName = reservation.court?.name
  const startTime = formatTime(reservation.start_time)
  const endTime = formatTime(reservation.end_time)

  const icsInput: ReservationIcsInput = {
    uid: reservation.id,
    title: `${venueName}${courtName ? ` — ${courtName}` : ''} rezervasyonu`,
    location: reservation.venue
      ? `${venueName}, ${reservation.venue.district}/${reservation.venue.city}`
      : undefined,
    description: 'SahaSepeti üzerinden yapılan rezervasyon.',
    date: reservation.reservation_date,
    startTime,
    endTime,
  }

  /** .ics dosyası indir — Apple/Outlook/Google hepsi açar. */
  const downloadIcs = () => {
    const blob = new Blob([buildReservationIcs(icsInput)], {
      type: 'text/calendar;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'sahasepeti-rezervasyon.ics'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  /** Davet metnini paylaş (Web Share API; yoksa panoya kopyala). */
  const share = async () => {
    const link = reservation.venue
      ? `${window.location.origin}/tesis/${reservation.venue.slug}`
      : window.location.origin
    const text = `⚽ ${venueName} — ${formatDateLong(reservation.reservation_date)}, ${startTime}–${endTime}. Rezervasyon tamam, geliyor musun? ${link}`

    if (navigator.share) {
      try {
        await navigator.share({ text })
      } catch {
        // Kullanıcı paylaşımı iptal etti — sessiz geç
      }
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      toast('Davet metni panoya kopyalandı', 'success')
    } catch {
      toast('Kopyalama başarısız oldu', 'error')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      <button type="button" onClick={downloadIcs} className={ACTION_CLASS}>
        <CalendarPlus className="size-3.5" aria-hidden />
        Takvime Ekle
      </button>
      <a
        href={googleCalendarUrl(icsInput)}
        target="_blank"
        rel="noreferrer"
        className={ACTION_CLASS}
      >
        <ExternalLink className="size-3.5" aria-hidden />
        Google Takvim
      </a>
      <button type="button" onClick={() => void share()} className={ACTION_CLASS}>
        <Share2 className="size-3.5" aria-hidden />
        Paylaş
      </button>
    </div>
  )
}
