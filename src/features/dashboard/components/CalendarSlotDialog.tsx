import { useEffect, useState } from 'react'
import { CalendarPlus, Trash2, Wrench } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/useToast'
import { cn } from '@/lib/utils'
import { formatPrice, formatTime } from '@/lib/format'
import { useScheduleMutations } from '@/features/dashboard/hooks/useDashboard'
import type { ScheduleSlot } from '@/features/dashboard/types'

interface CalendarSlotDialogProps {
  open: boolean
  onClose: () => void
  venueId: string
  courtId: string
  courtName: string
  date: string
  slot: ScheduleSlot | null
}

export function CalendarSlotDialog({
  open,
  onClose,
  venueId,
  courtId,
  courtName,
  date,
  slot,
}: CalendarSlotDialogProps) {
  const { addManual, addBlock, remove, setNoShow } = useScheduleMutations()
  const { toast } = useToast()

  const [mode, setMode] = useState<'manual' | 'block'>('manual')
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (open) {
      setMode('manual')
      setGuestName('')
      setGuestPhone('')
      setNotes('')
      setReason('')
    }
  }, [open, slot])

  if (!slot) return null

  const timeLabel = `${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}`
  const reservation = slot.reservation

  // ---- Dolu slot: detay + aksiyonlar ----
  if (reservation) {
    const handleDelete = () => {
      remove.mutate(reservation.id, {
        onSuccess: () => {
          toast(reservation.isBlock ? 'Blok kaldırıldı' : 'Kayıt silindi', 'success')
          onClose()
        },
        onError: (error) => toast(error.message, 'error'),
      })
    }
    const handleNoShow = () => {
      setNoShow.mutate(
        { reservationId: reservation.id, value: !reservation.noShow },
        {
          onSuccess: () => {
            toast(reservation.noShow ? 'No-show kaldırıldı' : 'No-show işaretlendi', 'success')
            onClose()
          },
          onError: (error) => toast(error.message, 'error'),
        },
      )
    }

    return (
      <Dialog open={open} onClose={onClose} title={`${courtName} · ${timeLabel}`}>
        {reservation.isBlock ? (
          <div className="flex items-center gap-2">
            <Badge variant="neutral">Bakım / Blok</Badge>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-ink-50">
                {reservation.customerName}
              </span>
              {reservation.noShow && <Badge variant="danger">Gelmedi</Badge>}
            </div>
            {reservation.customerPhone && (
              <p className="text-sm text-slate-500 dark:text-ink-400">{reservation.customerPhone}</p>
            )}
          </div>
        )}

        {reservation.notes && (
          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-ink-950 dark:text-ink-300">
            {reservation.notes}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          {!reservation.isBlock && (
            <Button
              variant={reservation.noShow ? 'outline' : 'secondary'}
              className="flex-1"
              isLoading={setNoShow.isPending}
              onClick={handleNoShow}
            >
              {reservation.noShow ? "No-show'u kaldır" : 'Gelmedi (No-show)'}
            </Button>
          )}
          {reservation.deletable && (
            <Button
              variant="danger"
              className="flex-1"
              isLoading={remove.isPending}
              onClick={handleDelete}
            >
              <Trash2 className="size-4" aria-hidden />
              {reservation.isBlock ? 'Bloğu Kaldır' : 'Sil'}
            </Button>
          )}
        </div>
      </Dialog>
    )
  }

  // ---- Boş slot: manuel rezervasyon veya blok ----
  const submitManual = () => {
    if (guestName.trim().length < 2) {
      toast('Müşteri adını girin', 'error')
      return
    }
    addManual.mutate(
      {
        venueId,
        courtId,
        date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast('Manuel rezervasyon eklendi', 'success')
          onClose()
        },
        onError: (error) => toast(error.message, 'error'),
      },
    )
  }

  const submitBlock = () => {
    addBlock.mutate(
      {
        venueId,
        courtId,
        date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        reason: reason.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast('Saat bloklandı', 'success')
          onClose()
        },
        onError: (error) => toast(error.message, 'error'),
      },
    )
  }

  return (
    <Dialog open={open} onClose={onClose} title={`${courtName} · ${timeLabel}`}>
      {slot.price !== null && (
        <p className="text-sm text-slate-500 dark:text-ink-400">
          Ücret: <span className="font-semibold text-slate-700 dark:text-ink-200">{formatPrice(slot.price)}</span>
        </p>
      )}

      {/* Mod seçimi */}
      <div className="mt-3 inline-flex rounded-xl border border-slate-200 p-0.5 dark:border-ink-700">
        {(
          [
            { key: 'manual', label: 'Manuel Rezervasyon', icon: CalendarPlus },
            { key: 'block', label: 'Saat Blokla', icon: Wrench },
          ] as const
        ).map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setMode(option.key)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              mode === option.key
                ? 'bg-primary-600 text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-ink-300 dark:hover:bg-ink-800',
            )}
          >
            <option.icon className="size-4" aria-hidden />
            {option.label}
          </button>
        ))}
      </div>

      {mode === 'manual' ? (
        <div className="mt-4 space-y-3">
          <Input
            label="Müşteri adı"
            placeholder="Örn. Ahmet Yılmaz"
            maxLength={80}
            value={guestName}
            onChange={(event) => setGuestName(event.target.value)}
          />
          <Input
            label="Telefon (isteğe bağlı)"
            type="tel"
            placeholder="0555 555 55 55"
            value={guestPhone}
            onChange={(event) => setGuestPhone(event.target.value)}
          />
          <Textarea
            label="Not (isteğe bağlı)"
            placeholder="Telefonla alındı, peşin ödendi..."
            maxLength={500}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
          <Button className="w-full" isLoading={addManual.isPending} onClick={submitManual}>
            Rezervasyonu Ekle
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <Textarea
            label="Açıklama (isteğe bağlı)"
            placeholder="Bakım, özel etkinlik..."
            maxLength={200}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
          <Button
            variant="secondary"
            className="w-full"
            isLoading={addBlock.isPending}
            onClick={submitBlock}
          >
            <Wrench className="size-4" aria-hidden />
            Saati Blokla
          </Button>
        </div>
      )}
    </Dialog>
  )
}
