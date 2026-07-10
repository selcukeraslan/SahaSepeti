import { useState } from 'react'
import { Check, Inbox, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Textarea } from '@/components/ui/Textarea'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/useToast'
import { useAdminVenueMutations, useAdminVenues } from '@/features/admin/hooks/useAdmin'
import type { AdminVenue } from '@/features/admin/services/admin.service'

export function AdminVenueQueue() {
  const { data: venues, isLoading } = useAdminVenues('pending')
  const { approve, reject } = useAdminVenueMutations()
  const { toast } = useToast()
  const [rejectTarget, setRejectTarget] = useState<AdminVenue | null>(null)
  const [reason, setReason] = useState('')

  const handleApprove = (venueId: string) => {
    approve.mutate(venueId, {
      onSuccess: () => toast('Tesis onaylandı ve yayına alındı', 'success'),
      onError: (error) => toast(error.message, 'error'),
    })
  }

  const handleReject = () => {
    if (!rejectTarget) return
    if (reason.trim().length < 5) {
      toast('Lütfen bir red gerekçesi yazın', 'error')
      return
    }
    reject.mutate(
      { venueId: rejectTarget.id, reason: reason.trim() },
      {
        onSuccess: () => {
          setRejectTarget(null)
          setReason('')
          toast('Tesis reddedildi', 'success')
        },
        onError: (error) => toast(error.message, 'error'),
      },
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Onay Kuyruğu</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Onay bekleyen tesisleri inceleyin, yayına alın veya gerekçeyle reddedin.
      </p>

      <div className="mt-5 space-y-3">
        {isLoading &&
          Array.from({ length: 2 }, (_, index) => <Skeleton key={index} className="h-32" />)}

        {venues && venues.length === 0 && (
          <EmptyState
            icon={Inbox}
            title="Onay bekleyen tesis yok"
            description="Yeni başvurular burada görünecek."
          />
        )}

        {venues?.map((venue) => (
          <div
            key={venue.id}
            className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex flex-col gap-4 sm:flex-row">
              {venue.cover_image_url && (
                <img
                  src={venue.cover_image_url}
                  alt={venue.name}
                  className="h-32 w-full rounded-xl object-cover sm:w-48"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 dark:text-slate-50">{venue.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {venue.district}, {venue.city}
                  {venue.address && ` — ${venue.address}`}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Sahibi: {venue.owner?.full_name || '—'}
                  {venue.owner?.phone && ` · ${venue.owner.phone}`}
                </p>
                {venue.description && (
                  <p className="mt-2 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">{venue.description}</p>
                )}
                {venue.amenities.length > 0 && (
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">{venue.amenities.join(' · ')}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRejectTarget(venue)
                  setReason('')
                }}
              >
                <X className="size-4" aria-hidden />
                Reddet
              </Button>
              <Button size="sm" isLoading={approve.isPending} onClick={() => handleApprove(venue.id)}>
                <Check className="size-4" aria-hidden />
                Onayla ve Yayınla
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Red gerekçesi */}
      <Dialog
        open={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
        title={`Reddet: ${rejectTarget?.name ?? ''}`}
      >
        <Textarea
          label="Red Gerekçesi"
          placeholder="Tesis sahibine iletilecek gerekçeyi yazın..."
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setRejectTarget(null)}>
            Vazgeç
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            isLoading={reject.isPending}
            onClick={handleReject}
          >
            Reddet
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
