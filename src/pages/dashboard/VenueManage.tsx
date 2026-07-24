import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/useToast'
import { VenueForm } from '@/features/dashboard/components/VenueForm'
import { CourtManager } from '@/features/dashboard/components/CourtManager'
import { OpeningHoursEditor } from '@/features/dashboard/components/OpeningHoursEditor'
import { ImageManager } from '@/features/dashboard/components/ImageManager'
import { useMyVenues, useVenueMutations } from '@/features/dashboard/hooks/useDashboard'
import { VENUE_STATUS_LABELS, VENUE_STATUS_VARIANTS } from '@/features/dashboard/types'
import { cn } from '@/lib/utils'
import { NotFound } from '@/pages/NotFound'

type Tab = 'info' | 'courts' | 'hours' | 'images'

const TABS: { key: Tab; label: string }[] = [
  { key: 'info', label: 'Bilgiler' },
  { key: 'courts', label: 'Sahalar & Fiyatlar' },
  { key: 'hours', label: 'Çalışma Saatleri' },
  { key: 'images', label: 'Görseller' },
]

export function VenueManage() {
  const { id } = useParams<{ id: string }>()
  const { data: venues, isLoading } = useMyVenues()
  const { update, submit } = useVenueMutations()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('info')

  if (isLoading) {
    return <Skeleton className="h-96" />
  }

  const venue = venues?.find((item) => item.id === id)
  if (!venue) {
    return <NotFound />
  }

  return (
    <div className="max-w-3xl">
      <Link
        to="/panel/tesisler"
        className="flex items-center gap-1 text-sm font-medium text-slate-500 dark:text-ink-400 hover:text-slate-700 dark:hover:text-ink-200"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Tesislerim
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-ink-50">{venue.name}</h1>
          <Badge variant={VENUE_STATUS_VARIANTS[venue.status]}>
            {VENUE_STATUS_LABELS[venue.status]}
          </Badge>
        </div>
        {(venue.status === 'draft' || venue.status === 'rejected') && (
          <Button
            size="sm"
            isLoading={submit.isPending}
            onClick={() =>
              submit.mutate(venue.id, {
                onSuccess: () => toast('Tesisiniz onaya gönderildi', 'success'),
                onError: (error) => toast(error.message, 'error'),
              })
            }
          >
            <Send className="size-4" aria-hidden />
            Onaya Gönder
          </Button>
        )}
      </div>
      {venue.status === 'rejected' && venue.rejection_reason && (
        <p className="mt-3 rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          Red gerekçesi: {venue.rejection_reason}
        </p>
      )}

      {/* Sekmeler */}
      <div className="mt-5 flex gap-1 border-b border-slate-200 dark:border-ink-800" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              '-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              activeTab === tab.key
                ? 'border-primary-600 text-primary-700 dark:text-primary-300'
                : 'border-transparent text-slate-500 dark:text-ink-400 hover:text-slate-700 dark:hover:text-ink-200',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'info' && (
          <VenueForm
            defaultValues={{
              name: venue.name,
              description: venue.description,
              city: venue.city,
              district: venue.district,
              address: venue.address,
              phone: venue.phone ?? '',
              amenities: venue.amenities,
              sportIds: venue.sports.map((sport) => sport.id),
              latitude: venue.latitude,
              longitude: venue.longitude,
            }}
            isSaving={update.isPending}
            submitLabel="Değişiklikleri Kaydet"
            onSubmit={(data) =>
              update.mutate(
                { venueId: venue.id, input: data },
                {
                  onSuccess: () => toast('Tesis bilgileri güncellendi', 'success'),
                  onError: (error) => toast(error.message, 'error'),
                },
              )
            }
          />
        )}
        {activeTab === 'courts' && <CourtManager venueId={venue.id} />}
        {activeTab === 'hours' && <OpeningHoursEditor venueId={venue.id} />}
        {activeTab === 'images' && (
          <ImageManager venueId={venue.id} coverImageUrl={venue.cover_image_url} />
        )}
      </div>
    </div>
  )
}
