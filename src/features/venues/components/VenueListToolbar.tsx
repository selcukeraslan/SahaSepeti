import { List, LocateFixed, Map as MapIcon, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export type VenueListView = 'list' | 'map'

interface VenueListToolbarProps {
  activeFilterCount: number
  isNearMe: boolean
  locating: boolean
  view: VenueListView
  onToggleNearMe: () => void
  onViewChange: (view: VenueListView) => void
  onOpenFilters: () => void
}

export function VenueListToolbar({
  activeFilterCount,
  isNearMe,
  locating,
  view,
  onToggleNearMe,
  onViewChange,
  onOpenFilters,
}: VenueListToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button variant={isNearMe ? 'secondary' : 'outline'} size="sm" isLoading={locating} onClick={onToggleNearMe} aria-pressed={isNearMe}>
        <LocateFixed className="size-4" aria-hidden />
        {isNearMe ? 'Yakınımdakiler ✓' : 'Yakınımdakiler'}
      </Button>
      <div className="inline-flex rounded-xl border border-slate-200 p-0.5 dark:border-ink-700" role="group" aria-label="Görünüm">
        {([
          { key: 'list', label: 'Liste', icon: List },
          { key: 'map', label: 'Harita', icon: MapIcon },
        ] as const).map((option) => (
          <button
            key={option.key}
            type="button"
            aria-pressed={view === option.key}
            onClick={() => onViewChange(option.key)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              view === option.key
                ? 'bg-primary-600 text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-ink-300 dark:hover:bg-ink-800',
            )}
          >
            <option.icon className="size-4" aria-hidden />
            {option.label}
          </button>
        ))}
      </div>
      <Button variant="outline" size="sm" className="lg:hidden" onClick={onOpenFilters}>
        <SlidersHorizontal className="size-4" aria-hidden />
        Filtreler
        {activeFilterCount > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">{activeFilterCount}</span>
        )}
      </Button>
    </div>
  )
}
