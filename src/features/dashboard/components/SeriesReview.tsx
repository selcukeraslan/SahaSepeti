import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/useToast'
import { formatDateShort, formatPrice } from '@/lib/format'
import { useSeriesMutation } from '../hooks/useSeries'
import { seriesInputSchema, type SeriesInput, type SeriesResult } from '../series.schemas'

/** Parent input değişince key değiştirir; eski önizleme yeni bilgilerle onaylanamaz. */
export function SeriesReview({ input, onSaved, onBusy }: {
  input: SeriesInput; onSaved: () => void; onBusy?: (busy: boolean) => void
}) {
  const mutation = useSeriesMutation()
  const [result, setResult] = useState<SeriesResult | null>(null)
  const { toast } = useToast()
  const run = (preview: boolean) => {
    const parsed = seriesInputSchema.safeParse(input)
    if (!parsed.success) { toast(parsed.error.issues[0]?.message ?? 'Bilgileri kontrol edin', 'error'); return }
    onBusy?.(true)
    mutation.mutate({ input: parsed.data, preview }, {
      onSuccess: (data) => {
        setResult(data)
        if (data.saved) { toast('Seri işlemi tamamlandı', 'success'); onSaved() }
        else if (!data.valid) toast('Bazı haftalar uygun değil. Hiçbir değişiklik kaydedilmedi.', 'error')
      },
      onError: (error) => { setResult(null); toast(error.message, 'error') },
      onSettled: () => onBusy?.(false),
    })
  }
  return <div className="space-y-3">
    <Button variant="outline" className="w-full" isLoading={mutation.isPending} onClick={() => run(true)}>
      Tarihleri ve İşlemi Önizle
    </Button>
    {result && <div aria-live="polite" className="space-y-3">
      <p className="text-sm font-semibold">{result.count} rezervasyon etkilenecek</p>
      <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
        {result.dates.map((row) => <li key={row.date} className="flex flex-wrap justify-between gap-2">
          <span>{formatDateShort(row.date)}</span>
          <span className={row.error ? 'text-red-600 dark:text-red-400' : ''}>
            {row.error ?? (row.price !== null ? formatPrice(row.price) : 'Uygun')}
          </span>
        </li>)}
      </ul>
      <p className="text-xs text-slate-500 dark:text-ink-400">
        {input.action === 'cancel' ? 'Seçili gelecek rezervasyonlar iptal edilecek.' : 'Fiyatlar her hafta için sunucuda hesaplanır.'}
        {' '}Bir hata olursa işlemin tamamı geri alınır. Önizleme rezervasyon yapmaz.
      </p>
      <Button className="w-full" variant={input.action === 'cancel' ? 'danger' : 'primary'}
        disabled={!result.valid || result.saved} isLoading={mutation.isPending} onClick={() => run(false)}>
        {input.action === 'cancel' ? 'İptali Onayla' : 'Onayla ve Kaydet'}
      </Button>
    </div>}
  </div>
}
