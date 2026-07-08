import { Link } from 'react-router-dom'
import { Building2, ExternalLink, Pencil, Plus, Send } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/useToast'
import { useMyVenues, useVenueMutations } from '@/features/dashboard/hooks/useDashboard'
import { VENUE_STATUS_LABELS, VENUE_STATUS_VARIANTS } from '@/features/dashboard/types'

export function DashboardVenues() {
  const { data: venues, isLoading } = useMyVenues()
  const { submit } = useVenueMutations()
  const { toast } = useToast()

  const handleSubmitForApproval = (venueId: string) => {
    submit.mutate(venueId, {
      onSuccess: () => toast('Tesisiniz onaya gönderildi', 'success'),
      onError: (error) => toast(error.message, 'error'),
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Tesislerim</h1>
        <Link to="/panel/tesisler/yeni">
          <Button size="sm">
            <Plus className="size-4" aria-hidden />
            Yeni Tesis
          </Button>
        </Link>
      </div>

      <div className="mt-5 space-y-3">
        {isLoading &&
          Array.from({ length: 2 }, (_, index) => <Skeleton key={index} className="h-32" />)}

        {venues && venues.length === 0 && (
          <EmptyState
            icon={Building2}
            title="Henüz tesis eklemediniz"
            description="İlk tesisinizi ekleyin, sahalarınızı tanımlayın ve rezervasyon almaya başlayın."
            action={
              <Link to="/panel/tesisler/yeni">
                <Button>Tesis Ekle</Button>
              </Link>
            }
          />
        )}

        {venues?.map((venue) => (
          <div
            key={venue.id}
            className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={VENUE_STATUS_VARIANTS[venue.status]}>
                  {VENUE_STATUS_LABELS[venue.status]}
                </Badge>
                {venue.sports.map((sport) => (
                  <span key={sport.id} className="text-xs text-slate-400">
                    {sport.name}
                  </span>
                ))}
              </div>
              <p className="mt-1.5 font-semibold text-slate-900">{venue.name}</p>
              <p className="text-sm text-slate-500">
                {venue.district}, {venue.city}
              </p>
              {venue.status === 'rejected' && venue.rejection_reason && (
                <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  Red gerekçesi: {venue.rejection_reason}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {venue.status === 'approved' && (
                <Link to={`/tesis/${venue.slug}`} target="_blank">
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="size-4" aria-hidden />
                    Görüntüle
                  </Button>
                </Link>
              )}
              <Link to={`/panel/tesisler/${venue.id}`}>
                <Button variant="outline" size="sm">
                  <Pencil className="size-4" aria-hidden />
                  Yönet
                </Button>
              </Link>
              {(venue.status === 'draft' || venue.status === 'rejected') && (
                <Button
                  size="sm"
                  isLoading={submit.isPending}
                  onClick={() => handleSubmitForApproval(venue.id)}
                >
                  <Send className="size-4" aria-hidden />
                  Onaya Gönder
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
