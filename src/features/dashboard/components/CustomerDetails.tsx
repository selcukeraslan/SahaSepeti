import { useState } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Skeleton } from '@/components/ui/Skeleton'
import { QueryErrorState } from '@/components/ui/QueryErrorState'
import { useToast } from '@/components/ui/useToast'
import type { VenueCustomerRow } from '@/types/database.types'
import { formatDateShort, formatPrice, formatTime } from '@/lib/format'
import { RESERVATION_STATUS_LABELS } from '@/features/reservations/types'
import { useCustomer, useCustomerHistory, useSaveCustomer } from '../hooks/useCustomers'
import { CustomerDeleteAction } from './CustomerDeleteAction'

function CustomerEditor({ customer }: { customer: VenueCustomerRow }) {
  const [notes, setNotes] = useState(customer.notes)
  const [confirm, setConfirm] = useState(false)
  const [reason, setReason] = useState('')
  const mutation = useSaveCustomer()
  const { toast } = useToast()
  return <div className="space-y-3">
    <p className="text-sm text-slate-500 dark:text-ink-400">{customer.normalized_phone}</p>
    {customer.is_blacklisted && <p role="status" className="text-sm text-red-600 dark:text-red-400">Kara listede: {customer.blacklist_reason}</p>}
    {!customer.is_blacklisted && customer.blacklist_reason && <p className="text-xs text-slate-500">Son durum gerekçesi: {customer.blacklist_reason}</p>}
    <Textarea label="Müşteri notu" maxLength={1000} value={notes} disabled={mutation.isPending} onChange={(e) => setNotes(e.target.value)} />
    <div className="flex flex-wrap gap-2">
      <Button isLoading={mutation.isPending} onClick={() => mutation.mutate({ action: 'notes', id: customer.id, notes }, {
        onSuccess: () => toast('Not kaydedildi', 'success'), onError: (error) => toast(error.message, 'error'),
      })}>Notu Kaydet</Button>
      <Button variant="outline" disabled={mutation.isPending} onClick={() => setConfirm(!confirm)}>
        {customer.is_blacklisted ? 'Kara Listeden Çıkar' : 'Kara Listeye Al'}
      </Button>
    </div>
    {confirm && <div className="space-y-3 rounded-xl border border-amber-300 p-3">
      <p className="text-sm">{customer.is_blacklisted ? 'Müşteri tekrar rezervasyon yapabilecek.' : 'Yeni manuel ve haftalık rezervasyonlar engellenecek. Mevcut kayıtlar iptal edilmeyecek.'}</p>
      <Textarea label="Gerekçe (zorunlu)" maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} disabled={mutation.isPending} />
      <Button variant="danger" isLoading={mutation.isPending} onClick={() => mutation.mutate({ action: 'blacklist', id: customer.id,
        blocked: !customer.is_blacklisted, reason }, { onSuccess: () => { setConfirm(false); toast('Müşteri durumu güncellendi', 'success') },
        onError: (error) => toast(error.message, 'error') })}>Değişikliği Onayla</Button>
    </div>}
  </div>
}

function CustomerHistory({ id }: { id: string }) {
  const [page, setPage] = useState(0)
  const { data, isLoading, isError, isFetching, refetch } = useCustomerHistory(id, page)
  return <div className="mt-5 space-y-3">
    <h3 className="font-semibold">Rezervasyon Geçmişi</h3>
    {isLoading && <Skeleton className="h-24" />}
    {isError && <QueryErrorState title="Geçmiş yüklenemedi" isRetrying={isFetching} onRetry={() => { void refetch() }} />}
    {data?.length === 0 && <p className="text-sm text-slate-500">Rezervasyon bulunamadı.</p>}
    {data?.map((row) => <div key={row.id} className="rounded-xl border border-slate-200 p-3 text-sm dark:border-ink-800">
      <p>{formatDateShort(row.reservation_date)} · {formatTime(row.start_time)}–{formatTime(row.end_time)}</p>
      <p>{RESERVATION_STATUS_LABELS[row.status]} · {formatPrice(row.total_price)}{row.no_show && ' · Gelmedi'}</p>
    </div>)}
    <div className="flex gap-2">
      <Button size="sm" variant="ghost" disabled={page === 0 || isFetching} onClick={() => setPage(page - 1)}>Önceki</Button>
      <Button size="sm" variant="ghost" disabled={data?.length !== 20 || isFetching} onClick={() => setPage(page + 1)}>Sonraki</Button>
    </div>
  </div>
}
export function CustomerDetails({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, isLoading, isError, isFetching, refetch } = useCustomer(id)
  return <Dialog open onClose={onClose} title={data?.display_name ?? 'Müşteri Detayı'}>
    {isLoading && <Skeleton className="h-32" />}
    {isError && <QueryErrorState title="Müşteri yüklenemedi" isRetrying={isFetching} onRetry={() => { void refetch() }} />}
    {data && <><CustomerEditor key={`${id}-${data.updated_at}`} customer={data} /><CustomerHistory id={id} /><CustomerDeleteAction id={id} onDeleted={onClose} /></>}
  </Dialog>
}
