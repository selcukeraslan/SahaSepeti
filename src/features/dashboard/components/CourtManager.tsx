import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { QueryErrorState } from '@/components/ui/QueryErrorState'
import { useToast } from '@/components/ui/useToast'
import { useSports } from '@/features/venues/hooks/useSports'
import type { Court } from '@/types/database.types'
import { useCourtMutations, useVenueCourts } from '../hooks/useDashboard'
import type { CourtInput } from '../schemas'
import { CourtCard } from './CourtCard'
import { CourtDialog } from './CourtDialog'

export function CourtManager({ venueId }: { venueId: string }) {
  const { data: courts, isLoading, isError, isFetching, refetch } = useVenueCourts(venueId)
  const { data: sports } = useSports()
  const { create, update, toggleActive } = useCourtMutations(venueId)
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCourt, setEditingCourt] = useState<Court | null>(null)
  const [expandedCourtId, setExpandedCourtId] = useState<string | null>(null)

  const handleSave = (data: CourtInput) => {
    const onError = (error: Error) => toast(error.message, 'error')
    if (editingCourt) {
      update.mutate(
        { courtId: editingCourt.id, input: data },
        {
          onSuccess: () => {
            setDialogOpen(false)
            toast('Saha güncellendi', 'success')
          },
          onError,
        },
      )
      return
    }
    create.mutate(data, {
      onSuccess: () => {
        setDialogOpen(false)
        toast('Saha eklendi — şimdi fiyat kuralı tanımlayın', 'success')
      },
      onError,
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-ink-400">
          Sahalarınızı tanımlayın ve her biri için saatlik fiyat kuralları ekleyin.
        </p>
        <Button size="sm" disabled={create.isPending || update.isPending || toggleActive.isPending} onClick={() => { setEditingCourt(null); setDialogOpen(true) }}>
          <Plus className="size-4" aria-hidden />
          Saha Ekle
        </Button>
      </div>
      <div className="mt-4 space-y-3">
        {isLoading && Array.from({ length: 2 }, (_, index) => <Skeleton key={index} className="h-20" />)}
        {isError && (
          <QueryErrorState
            title="Sahalar yüklenemedi"
            isRetrying={isFetching}
            onRetry={() => { void refetch() }}
          />
        )}
        {courts && courts.length === 0 && (
          <EmptyState
            title="Henüz saha yok"
            description="Rezervasyon alabilmek için en az bir saha eklemelisiniz."
            action={
              <Button size="sm" onClick={() => { setEditingCourt(null); setDialogOpen(true) }}>
                <Plus className="size-4" aria-hidden />
                Saha Ekle
              </Button>
            }
          />
        )}
        {courts?.map((court) => (
          <CourtCard
            key={court.id}
            court={court}
            expanded={expandedCourtId === court.id}
            isToggling={toggleActive.isPending && toggleActive.variables?.courtId === court.id}
            actionsDisabled={create.isPending || update.isPending || toggleActive.isPending}
            onEdit={() => { setEditingCourt(court); setDialogOpen(true) }}
            onToggleExpanded={() => setExpandedCourtId(expandedCourtId === court.id ? null : court.id)}
            onToggleActive={() => toggleActive.mutate(
              { courtId: court.id, isActive: !court.is_active },
              {
                onSuccess: () => toast(court.is_active ? 'Saha pasife alındı' : 'Saha aktifleştirildi', 'success'),
                onError: (error) => toast(error.message, 'error'),
              },
            )}
          />
        ))}
      </div>
      <CourtDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        sports={sports ?? []}
        editing={editingCourt}
        onSave={handleSave}
        isSaving={create.isPending || update.isPending}
      />
    </div>
  )
}
