import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { QueryErrorState } from '@/components/ui/QueryErrorState'
import { formatDateShort } from '@/lib/format'
import { useMyVenues } from '@/features/dashboard/hooks/useDashboard'
import { useCustomers } from '@/features/dashboard/hooks/useCustomers'
import { customerFilterSchema, type CustomerFilter } from '@/features/dashboard/customers.schemas'
import { CustomerDetails } from '@/features/dashboard/components/CustomerDetails'
import { CustomerCreateForm } from '@/features/dashboard/components/CustomerCreateForm'

export function DashboardCustomers() {
  const venues = useMyVenues()
  const [venueId, setVenueId] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<CustomerFilter>('all')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  useEffect(() => { if (!venueId && venues.data?.[0]) setVenueId(venues.data[0].id) }, [venueId, venues.data])
  const { data, isLoading, isError, isFetching, isDebouncing, refetch } = useCustomers(venueId, query, filter, page)
  if (venues.isLoading) return <Skeleton className="h-64" />
  if (venues.isError) return <QueryErrorState title="Tesisler yüklenemedi" isRetrying={venues.isFetching} onRetry={() => { void venues.refetch() }} />
  if (!venues.data?.length) return <EmptyState title="Önce bir tesis ekleyin" description="Müşteri rehberi tesis bazında tutulur."
    action={<Link to="/panel/tesisler/yeni"><Button>Tesis Ekle</Button></Link>} />
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold">Müşteriler</h1>
      <Button disabled={!venueId} onClick={() => setCreating(!creating)}>Yeni Müşteri</Button>
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      <Select aria-label="Tesis" value={venueId} options={venues.data.map((v) => ({ value: v.id, label: v.name }))}
        onChange={(e) => { setVenueId(e.target.value); setPage(0); setCreating(false); setSelected(null) }} />
      <Input aria-label="Müşteri ara" placeholder="Ad, telefon veya son 4 hane" maxLength={80} value={query}
        onChange={(e) => { setQuery(e.target.value); setPage(0) }} />
      <Select aria-label="Müşteri durumu" value={filter} onChange={(e) => { setFilter(customerFilterSchema.parse(e.target.value)); setPage(0) }}
        options={[{ value: 'all', label: 'Tüm müşteriler' }, { value: 'active', label: 'Aktif' },
          { value: 'blacklist', label: 'Kara liste' }, { value: 'no_show', label: 'No-show kaydı olanlar' }]} />
    </div>
    {creating && <CustomerCreateForm key={venueId} venueId={venueId} onSaved={(row) => { setCreating(false); setSelected(row.id) }} />}
    {(isLoading || isDebouncing) && <Skeleton className="h-40" />}
    {isError && <QueryErrorState title="Müşteriler yüklenemedi" isRetrying={isFetching} onRetry={() => { void refetch() }} />}
    {data?.length === 0 && <EmptyState title="Müşteri bulunamadı" description="Yeni müşteri ekleyebilir veya arama koşullarını değiştirebilirsiniz."
      action={<Button variant="outline" onClick={() => { setQuery(''); setFilter('all'); setPage(0) }}>Filtreleri Temizle</Button>} />}
    <div className="grid gap-4 md:grid-cols-2">
      {data?.map((row) => <button key={row.id} type="button" onClick={() => setSelected(row.id)}
        className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-soft transition-colors hover:border-primary-500 dark:border-ink-800 dark:bg-ink-900">
        <div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{row.display_name}</span>
          {row.is_blacklisted && <Badge variant="danger">Kara listede</Badge>}</div>
        <p className="mt-1 text-sm text-slate-500 dark:text-ink-400">{row.masked_phone}</p>
        <p className="mt-3 text-sm">{row.total_count} rezervasyon · {row.cancel_count} iptal · {row.no_show_count} no-show</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-ink-400">Son ziyaret: {row.last_visit ? formatDateShort(row.last_visit) : 'Henüz yok'}</p>
      </button>)}
    </div>
    <div className="flex items-center gap-3">
      <Button variant="outline" disabled={page === 0 || isFetching || isDebouncing} onClick={() => setPage(page - 1)}>Önceki</Button>
      <span className="text-sm">Sayfa {page + 1}</span>
      <Button variant="outline" disabled={data?.length !== 25 || isFetching || isDebouncing} onClick={() => setPage(page + 1)}>Sonraki</Button>
    </div>
    {selected && <CustomerDetails key={selected} id={selected} onClose={() => setSelected(null)} />}
  </div>
}
