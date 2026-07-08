import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Spinner({ className }: { className?: string }) {
  return (
    <div className="flex items-center justify-center py-12" role="status" aria-label="Yükleniyor">
      <Loader2 className={cn('size-8 animate-spin text-primary-600', className)} aria-hidden />
    </div>
  )
}
