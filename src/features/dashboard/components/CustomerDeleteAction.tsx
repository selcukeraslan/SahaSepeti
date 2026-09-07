import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/useToast'
import { useDeleteCustomer } from '../hooks/useCustomers'

export function CustomerDeleteAction({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const mutation = useDeleteCustomer()
  const { toast } = useToast()
  return <div className="mt-5 border-t border-slate-200 pt-4 dark:border-ink-800">
    {!confirming ? <Button variant="danger" onClick={() => setConfirming(true)}>Rehberden Sil</Button>
      : <div className="space-y-3 rounded-xl border border-red-300 p-3">
        <p className="text-sm font-semibold">Müşteriyi rehberden kaldırmak istiyor musunuz?</p>
        <p className="text-sm text-slate-500 dark:text-ink-400">
          Müşteri listeden ve rezervasyon seçiminden kaldırılır. Rezervasyonları iptal edilmez;
          geçmişi, notları ve kara liste bilgisi korunur. Bu işlem kalıcı veri silme değildir.
          Aynı telefonla yeniden kayıt veya başarılı yeni rezervasyon oluşturulursa rehbere geri gelir.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={mutation.isPending} onClick={() => setConfirming(false)}>Vazgeç</Button>
          <Button variant="danger" isLoading={mutation.isPending} onClick={() => mutation.mutate(id, {
            onSuccess: () => { toast('Müşteri rehberden kaldırıldı', 'success'); onDeleted() },
            onError: (error) => toast(error.message, 'error'),
          })}>Evet, Rehberden Sil</Button>
        </div>
      </div>}
  </div>
}
