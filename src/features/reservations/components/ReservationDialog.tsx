import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CalendarDays, Clock, MapPin } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/useToast'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { formatDateLong, formatPrice } from '@/lib/format'
import type { TimeSlot } from '@/features/venues/services/slots'
import type { CourtWithPrices, VenueDetail } from '@/features/venues/types'
import { useCreateReservation } from '../hooks/useReservations'

export interface ReservationDialogProps {
  venue: VenueDetail
  court: CourtWithPrices
  date: string
  slot: TimeSlot
  open: boolean
  onClose: () => void
}

/** Slot seçimi sonrası rezervasyon özeti ve onayı. */
export function ReservationDialog({
  venue,
  court,
  date,
  slot,
  open,
  onClose,
}: ReservationDialogProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const createReservation = useCreateReservation()
  const [notes, setNotes] = useState('')

  const handleConfirm = () => {
    createReservation.mutate(
      {
        courtId: court.id,
        venueId: venue.id,
        date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          onClose()
          setNotes('')
          toast('Rezervasyon talebiniz oluşturuldu!', 'success')
          navigate('/rezervasyonlarim')
        },
        onError: (error) => {
          toast(error.message, 'error')
        },
      },
    )
  }

  const handleLoginRedirect = () => {
    onClose()
    navigate('/giris', { state: { from: location.pathname + location.search } })
  }

  return (
    <Dialog open={open} onClose={onClose} title="Rezervasyon Özeti">
      <div className="flex flex-col gap-3 rounded-2xl bg-slate-50 dark:bg-ink-800/50 p-4">
        <p className="font-semibold text-slate-900 dark:text-ink-50">{venue.name}</p>
        <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-ink-300">
          <MapPin className="size-4 shrink-0 text-primary-600" aria-hidden />
          {venue.district}, {venue.city} — {court.name}
        </p>
        <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-ink-300">
          <CalendarDays className="size-4 shrink-0 text-primary-600" aria-hidden />
          {formatDateLong(date)}
        </p>
        <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-ink-300">
          <Clock className="size-4 shrink-0 text-primary-600" aria-hidden />
          {slot.startTime} – {slot.endTime}
        </p>
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-ink-800 pt-3">
          <span className="text-sm text-slate-500 dark:text-ink-400">Toplam</span>
          <span className="text-lg font-bold text-slate-900 dark:text-ink-50">
            {slot.price !== null ? formatPrice(slot.price) : '—'}
          </span>
        </div>
      </div>

      {user ? (
        <>
          <div className="mt-4">
            <Textarea
              label="Not (isteğe bağlı)"
              placeholder="Tesise iletmek istediğiniz bir not var mı?"
              value={notes}
              maxLength={500}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
          <p className="mt-3 text-xs text-slate-400 dark:text-ink-500">
            Rezervasyonunuz tesis onayına gönderilir. Ödeme tesiste yapılır; online ödeme yakında.
          </p>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Vazgeç
            </Button>
            <Button
              className="flex-1"
              isLoading={createReservation.isPending}
              onClick={handleConfirm}
            >
              Rezervasyonu Onayla
            </Button>
          </div>
        </>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-center text-sm text-slate-500 dark:text-ink-400">
            Rezervasyon yapmak için giriş yapmanız gerekiyor.
          </p>
          <Button size="lg" onClick={handleLoginRedirect}>
            Giriş Yap ve Devam Et
          </Button>
        </div>
      )}
    </Dialog>
  )
}
