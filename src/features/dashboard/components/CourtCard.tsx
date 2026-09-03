import { ChevronDown, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { Court, Sport } from '@/types/database.types'
import { PriceRuleEditor } from './PriceRuleEditor'

export type DashboardCourt = Court & { sport: Sport | null }

interface CourtCardProps {
  court: DashboardCourt
  expanded: boolean
  onEdit: () => void
  onToggleExpanded: () => void
  onToggleActive: () => void
  isToggling: boolean
  actionsDisabled: boolean
}

export function CourtCard({ court, expanded, onEdit, onToggleExpanded, onToggleActive, isToggling, actionsDisabled }: CourtCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-ink-800 dark:bg-ink-900">
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
          <Button variant="ghost" size="sm" isLoading={isToggling} disabled={actionsDisabled} onClick={onToggleActive}>
            {court.is_active ? 'Pasife Al' : 'Aktifleştir'}
          </Button>
          <button type="button" aria-label="Sahayı düzenle" disabled={actionsDisabled} onClick={onEdit} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-ink-500 dark:hover:bg-ink-800 dark:hover:text-ink-300">
            <Pencil className="size-4" />
          </button>
          <button type="button" aria-label={expanded ? 'Fiyatları gizle' : 'Fiyatları göster'} aria-expanded={expanded} disabled={actionsDisabled} onClick={onToggleExpanded} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-ink-500 dark:hover:bg-ink-800 dark:hover:text-ink-300">
            <ChevronDown className={cn('size-4 transition-transform', expanded && 'rotate-180')} />
          </button>
        </div>
      </div>
      {expanded && <PriceRuleEditor courtId={court.id} />}
    </div>
  )
}
