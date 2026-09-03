import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { QueryErrorState } from '@/components/ui/QueryErrorState'
import { useToast } from '@/components/ui/useToast'
import { formatPrice, formatTime } from '@/lib/format'
import { useCourtPriceRules, usePriceRuleMutations } from '../hooks/useDashboard'
import { priceRuleSchema, type PriceRuleInput } from '../schemas'
import { DAY_NAMES_TR } from '../types'

export function PriceRuleEditor({ courtId }: { courtId: string }) {
  const { data: rules, isLoading, isError, isFetching, refetch } = useCourtPriceRules(courtId)
  const { create, remove } = usePriceRuleMutations(courtId)
  const { toast } = useToast()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PriceRuleInput>({
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
    <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-4 dark:border-ink-800 dark:bg-ink-800/50">
      <p className="text-sm font-semibold text-slate-700 dark:text-ink-200">Fiyat Kuralları</p>
      {isLoading && <Skeleton className="mt-2 h-10" />}
      {isError && (
        <div className="mt-2">
          <QueryErrorState
            title="Fiyat kuralları yüklenemedi"
            isRetrying={isFetching}
            onRetry={() => { void refetch() }}
          />
        </div>
      )}
      {rules && rules.length === 0 && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
          Fiyat kuralı olmayan saha rezervasyona kapalıdır. En az bir kural ekleyin.
        </p>
      )}
      <ul className="mt-2 space-y-1.5">
        {rules?.map((rule) => (
          <li key={rule.id} className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm dark:bg-ink-900">
            <span className="text-slate-600 dark:text-ink-300">
              {rule.day_of_week === null ? 'Tüm günler' : DAY_NAMES_TR[rule.day_of_week]} · {formatTime(rule.start_time)}–{formatTime(rule.end_time)} ·{' '}
              <span className="font-semibold text-slate-900 dark:text-ink-50">{formatPrice(rule.price)}/saat</span>
            </span>
            <button
              type="button"
              aria-label="Kuralı sil"
              disabled={create.isPending || remove.isPending}
              onClick={() => remove.mutate(rule.id, {
                onSuccess: () => toast('Fiyat kuralı silindi', 'success'),
                onError: (error) => toast(error.message, 'error'),
              })}
              className="rounded-md p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-ink-500"
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-3 grid grid-cols-2 items-end gap-2 sm:grid-cols-5" noValidate>
        <Select
          label="Gün"
          options={[{ value: '', label: 'Tüm günler' }, ...DAY_NAMES_TR.map((name, index) => ({ value: String(index), label: name }))]}
          disabled={create.isPending || remove.isPending}
          {...register('dayOfWeek', { setValueAs: (value: string) => value === '' ? null : Number(value) })}
        />
        <Input label="Başlangıç" type="time" disabled={create.isPending || remove.isPending} error={errors.startTime?.message} {...register('startTime')} />
        <Input label="Bitiş" type="time" disabled={create.isPending || remove.isPending} error={errors.endTime?.message} {...register('endTime')} />
        <Input label="Saatlik ₺" type="number" min={0} step="50" disabled={create.isPending || remove.isPending} error={errors.price?.message} {...register('price', { valueAsNumber: true })} />
        <Button type="submit" size="md" isLoading={create.isPending} disabled={remove.isPending}>
          <Plus className="size-4" aria-hidden />
          Ekle
        </Button>
      </form>
    </div>
  )
}
