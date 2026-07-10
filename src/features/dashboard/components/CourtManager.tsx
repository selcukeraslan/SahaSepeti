import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/useToast'
import { useSports } from '@/features/venues/hooks/useSports'
import { formatPrice, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Court, Sport } from '@/types/database.types'
import {
  useCourtMutations,
  useCourtPriceRules,
  usePriceRuleMutations,
  useVenueCourts,
} from '../hooks/useDashboard'
import { courtSchema, priceRuleSchema, type CourtInput, type PriceRuleInput } from '../schemas'
import { DAY_NAMES_TR } from '../types'

// ---------- Fiyat kuralları ----------

function PriceRuleEditor({ courtId }: { courtId: string }) {
  const { data: rules, isLoading } = useCourtPriceRules(courtId)
  const { create, remove } = usePriceRuleMutations(courtId)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PriceRuleInput>({
    resolver: zodResolver(priceRuleSchema),
    defaultValues: { dayOfWeek: null, startTime: '09:00', endTime: '23:00', price: 0 },
  })

  const onSubmit = (data: PriceRuleInput) => {
    create.mutate(data, {
      onSuccess: () => {
        reset({ dayOfWeek: null, startTime: '09:00', endTime: '23:00', price: 0 })
        toast('Fiyat kuralı eklendi', 'success')
      },
      onError: (error) => toast(error.message, 'error'),
    })
  }

  return (
    <div className="border-t border-slate-100 dark:border-ink-800 bg-slate-50/60 dark:bg-ink-800/50 px-4 py-4">
      <p className="text-sm font-semibold text-slate-700 dark:text-ink-200">Fiyat Kuralları</p>
      {isLoading && <Skeleton className="mt-2 h-10" />}
      {rules && rules.length === 0 && (
        <p className="mt-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
          Fiyat kuralı olmayan saha rezervasyona kapalıdır. En az bir kural ekleyin.
        </p>
      )}
      <ul className="mt-2 space-y-1.5">
        {rules?.map((rule) => (
          <li
            key={rule.id}
            className="flex items-center justify-between gap-2 rounded-lg bg-white dark:bg-ink-900 px-3 py-2 text-sm"
          >
            <span className="text-slate-600 dark:text-ink-300">
              {rule.day_of_week === null ? 'Tüm günler' : DAY_NAMES_TR[rule.day_of_week]} ·{' '}
              {formatTime(rule.start_time)}–{formatTime(rule.end_time)} ·{' '}
              <span className="font-semibold text-slate-900 dark:text-ink-50">{formatPrice(rule.price)}/saat</span>
            </span>
            <button
              type="button"
              aria-label="Kuralı sil"
              onClick={() => remove.mutate(rule.id)}
              className="rounded-md p-1 text-slate-400 dark:text-ink-500 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-3 grid grid-cols-2 items-end gap-2 sm:grid-cols-5"
        noValidate
      >
        <Select
          label="Gün"
          options={[
            { value: '', label: 'Tüm günler' },
            ...DAY_NAMES_TR.map((name, index) => ({ value: String(index), label: name })),
          ]}
          {...register('dayOfWeek', {
            setValueAs: (value: string) => (value === '' ? null : Number(value)),
          })}
        />
        <Input label="Başlangıç" type="time" error={errors.startTime?.message} {...register('startTime')} />
        <Input label="Bitiş" type="time" error={errors.endTime?.message} {...register('endTime')} />
        <Input
          label="Saatlik ₺"
          type="number"
          min={0}
          step="50"
          error={errors.price?.message}
          {...register('price', { valueAsNumber: true })}
        />
        <Button type="submit" size="md" isLoading={create.isPending}>
          <Plus className="size-4" aria-hidden />
          Ekle
        </Button>
      </form>
    </div>
  )
}

// ---------- Saha formu ----------

const EMPTY_COURT: CourtInput = {
  name: '',
  sportId: '',
  surfaceType: '',
  isIndoor: false,
  capacity: undefined,
}

function CourtDialog({
  open,
  onClose,
  sports,
  editing,
  onSave,
  isSaving,
}: {
  open: boolean
  onClose: () => void
  sports: Sport[]
  editing: Court | null
  onSave: (data: CourtInput) => void
  isSaving: boolean
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CourtInput>({
    resolver: zodResolver(courtSchema),
    values: editing
      ? {
          name: editing.name,
          sportId: editing.sport_id,
          surfaceType: editing.surface_type ?? '',
          isIndoor: editing.is_indoor,
          capacity: editing.capacity ?? undefined,
        }
      : EMPTY_COURT,
  })

  return (
    <Dialog open={open} onClose={onClose} title={editing ? 'Sahayı Düzenle' : 'Yeni Saha'}>
      <form onSubmit={handleSubmit(onSave)} className="flex flex-col gap-4" noValidate>
        <Input
          label="Saha Adı"
          placeholder="Örn. Saha 1 (Büyük)"
          error={errors.name?.message}
          {...register('name')}
        />
        <Select
          label="Spor Türü"
          placeholder="Seçin"
          error={errors.sportId?.message}
          options={sports.map((sport) => ({ value: sport.id, label: sport.name }))}
          {...register('sportId')}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Zemin (isteğe bağlı)"
            placeholder="Suni çim, parke..."
            error={errors.surfaceType?.message}
            {...register('surfaceType')}
          />
          <Input
            label="Kapasite (isteğe bağlı)"
            type="number"
            min={1}
            placeholder="Örn. 14"
            error={errors.capacity?.message}
            {...register('capacity', {
              setValueAs: (value: string) => (value === '' ? undefined : Number(value)),
            })}
          />
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-ink-200">
          <input
            type="checkbox"
            className="size-4 rounded border-slate-300 dark:border-ink-700 accent-primary-600"
            {...register('isIndoor')}
          />
          Kapalı saha
        </label>
        <div className="mt-1 flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Vazgeç
          </Button>
          <Button type="submit" className="flex-1" isLoading={isSaving}>
            Kaydet
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

// ---------- Ana bileşen ----------

export function CourtManager({ venueId }: { venueId: string }) {
  const { data: courts, isLoading } = useVenueCourts(venueId)
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
    } else {
      create.mutate(data, {
        onSuccess: () => {
          setDialogOpen(false)
          toast('Saha eklendi — şimdi fiyat kuralı tanımlayın', 'success')
        },
        onError,
      })
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-ink-400">
          Sahalarınızı tanımlayın ve her biri için saatlik fiyat kuralları ekleyin.
        </p>
        <Button
          size="sm"
          onClick={() => {
            setEditingCourt(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="size-4" aria-hidden />
          Saha Ekle
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        {isLoading &&
          Array.from({ length: 2 }, (_, index) => <Skeleton key={index} className="h-20" />)}

        {courts && courts.length === 0 && (
          <EmptyState
            title="Henüz saha yok"
            description="Rezervasyon alabilmek için en az bir saha eklemelisiniz."
          />
        )}

        {courts?.map((court) => {
          const isExpanded = expandedCourtId === court.id
          return (
            <div
              key={court.id}
              className="overflow-hidden rounded-2xl border border-slate-200 dark:border-ink-800 bg-white dark:bg-ink-900"
            >
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900 dark:text-ink-50">{court.name}</p>
                    {!court.is_active && <Badge variant="danger">Pasif</Badge>}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-ink-400">
                    {court.sport?.name}
                    {court.surface_type && ` · ${court.surface_type}`}
                    {court.is_indoor ? ' · Kapalı' : ' · Açık'}
                    {court.capacity && ` · ${court.capacity} kişi`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      toggleActive.mutate({ courtId: court.id, isActive: !court.is_active })
                    }
                  >
                    {court.is_active ? 'Pasife Al' : 'Aktifleştir'}
                  </Button>
                  <button
                    type="button"
                    aria-label="Sahayı düzenle"
                    onClick={() => {
                      setEditingCourt(court)
                      setDialogOpen(true)
                    }}
                    className="rounded-lg p-2 text-slate-400 dark:text-ink-500 transition-colors hover:bg-slate-100 dark:hover:bg-ink-800 hover:text-slate-600 dark:hover:text-ink-300"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={isExpanded ? 'Fiyatları gizle' : 'Fiyatları göster'}
                    aria-expanded={isExpanded}
                    onClick={() => setExpandedCourtId(isExpanded ? null : court.id)}
                    className="rounded-lg p-2 text-slate-400 dark:text-ink-500 transition-colors hover:bg-slate-100 dark:hover:bg-ink-800 hover:text-slate-600 dark:hover:text-ink-300"
                  >
                    <ChevronDown
                      className={cn('size-4 transition-transform', isExpanded && 'rotate-180')}
                    />
                  </button>
                </div>
              </div>
              {isExpanded && <PriceRuleEditor courtId={court.id} />}
            </div>
          )
        })}
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
