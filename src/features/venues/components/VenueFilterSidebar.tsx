import type { VenueFilters } from '../types'
import { VenueFilterFields } from './VenueFilterFields'

interface VenueFilterSidebarProps {
  filters: VenueFilters
  activeFilterCount: number
  onChange: (filters: VenueFilters) => void
  onClear: () => void
}

export function VenueFilterSidebar({ filters, activeFilterCount, onChange, onClear }: VenueFilterSidebarProps) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-ink-700 dark:bg-ink-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 dark:text-ink-50">Filtreler</h2>
          {activeFilterCount > 0 && (
            <button type="button" onClick={onClear} className="text-sm font-medium text-primary-600 hover:text-primary-700">Temizle</button>
          )}
        </div>
        <VenueFilterFields filters={filters} onChange={onChange} />
      </div>
    </aside>
  )
}
