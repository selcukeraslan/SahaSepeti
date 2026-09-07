import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { QueryErrorState } from '@/components/ui/QueryErrorState'
import { formatDateShort, formatIstanbulTimestamp } from '@/lib/format'
import { useCustomers } from '../hooks/useCustomers'
import { CustomerCreateForm } from './CustomerCreateForm'

export interface SelectedCustomer { id: string; name: string; blocked: boolean }
export function CustomerPicker({ venueId, onSelect }: { venueId: string; onSelect: (value: SelectedCustomer) => void }) {
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [page, setPage] = useState(0)
  const { data, isLoading, isError, isFetching, isDebouncing, refetch } = useCustomers(venueId, query, 'all', page, 10)
  return <div className="space-y-3">
    <Input autoFocus label="Müşteri ara" placeholder="Ad, telefon veya son 4 hane" maxLength={80} value={query}
      onChange={(e) => { setQuery(e.target.value); setPage(0) }} />
    <p className="text-xs text-slate-500 dark:text-ink-400">Son kullanılan müşteriler önce gösterilir.</p>
    {(isLoading || isDebouncing) && <Skeleton className="h-20" />}
    {isError && <QueryErrorState title="Müşteriler yüklenemedi" isRetrying={isFetching} onRetry={() => { void refetch() }} />}
    <div className="max-h-48 space-y-2 overflow-y-auto">
      {data?.map((row) => <button key={row.id} type="button" className="w-full rounded-xl border border-slate-200 p-3 text-left text-sm hover:bg-primary-50 dark:border-ink-800 dark:hover:bg-primary-500/10"
        onClick={() => onSelect({ id: row.id, name: row.display_name, blocked: row.is_blacklisted })}>
        <span className="block font-semibold">{row.display_name}</span>
        <span className="block text-slate-500 dark:text-ink-400">{row.masked_phone}</span>
        <span className="block text-xs text-slate-500 dark:text-ink-400">
          Son kayıt: {row.last_booking_at ? formatIstanbulTimestamp(row.last_booking_at) : 'Henüz yok'}
        </span>
        <span className="block text-xs text-slate-500 dark:text-ink-400">Son ziyaret: {row.last_visit ? formatDateShort(row.last_visit) : 'Henüz yok'}</span>
        {row.no_show_count > 0 && <span className="block text-xs text-amber-700 dark:text-amber-400">{row.no_show_count} no-show kaydı</span>}
        {row.is_blacklisted && <span className="text-xs text-red-600 dark:text-red-400">Kara listede — rezervasyon engelli</span>}
      </button>)}
    </div>
    {data?.length === 0 && <p className="text-sm text-slate-500">Müşteri bulunamadı. Yeni kayıt ekleyebilirsiniz.</p>}
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="ghost" disabled={page === 0 || isFetching || isDebouncing} onClick={() => setPage(page - 1)}>Önceki</Button>
      <Button size="sm" variant="ghost" disabled={data?.length !== 10 || isFetching || isDebouncing} onClick={() => setPage(page + 1)}>Sonraki</Button>
      <Button size="sm" variant="outline" onClick={() => setCreating(!creating)}>Yeni Müşteri</Button>
    </div>
    {creating && <CustomerCreateForm venueId={venueId} onSaved={(row) => onSelect({ id: row.id, name: row.display_name, blocked: row.is_blacklisted })} />}
  </div>
}
