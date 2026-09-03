import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { Court, Sport } from '@/types/database.types'
import { courtSchema, type CourtInput } from '../schemas'

const EMPTY_COURT: CourtInput = {
  name: '',
  sportId: '',
  surfaceType: '',
  isIndoor: false,
  capacity: undefined,
}

interface CourtDialogProps {
  open: boolean
  onClose: () => void
  sports: Sport[]
  editing: Court | null
  onSave: (data: CourtInput) => void
  isSaving: boolean
}

export function CourtDialog({ open, onClose, sports, editing, onSave, isSaving }: CourtDialogProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<CourtInput>({
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
        <Input label="Saha Adı" placeholder="Örn. Saha 1 (Büyük)" disabled={isSaving} error={errors.name?.message} {...register('name')} />
        <Select label="Spor Türü" placeholder="Seçin" disabled={isSaving} error={errors.sportId?.message} options={sports.map((sport) => ({ value: sport.id, label: sport.name }))} {...register('sportId')} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Zemin (isteğe bağlı)" placeholder="Suni çim, parke..." disabled={isSaving} error={errors.surfaceType?.message} {...register('surfaceType')} />
          <Input
            label="Kapasite (isteğe bağlı)"
            type="number"
            min={1}
            disabled={isSaving}
            placeholder="Örn. 14"
            error={errors.capacity?.message}
            {...register('capacity', { setValueAs: (value: string) => value === '' ? undefined : Number(value) })}
          />
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-ink-200">
          <input type="checkbox" disabled={isSaving} className="size-4 rounded border-slate-300 accent-primary-600 dark:border-ink-700" {...register('isIndoor')} />
          Kapalı saha
        </label>
        <div className="mt-1 flex gap-2">
          <Button type="button" variant="outline" className="flex-1" disabled={isSaving} onClick={onClose}>Vazgeç</Button>
          <Button type="submit" className="flex-1" isLoading={isSaving}>Kaydet</Button>
        </div>
      </form>
    </Dialog>
  )
}
