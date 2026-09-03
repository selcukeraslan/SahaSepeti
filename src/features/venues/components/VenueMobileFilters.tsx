import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import type { VenueFilters } from '../types'
import { VenueFilterFields } from './VenueFilterFields'

interface VenueMobileFiltersProps {
  open: boolean
  filters: VenueFilters
  onChange: (filters: VenueFilters) => void
  onClear: () => void
  onClose: () => void
}

export function VenueMobileFilters({ open, filters, onChange, onClear, onClose }: VenueMobileFiltersProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Filtreler" side="bottom">
      <VenueFilterFields filters={filters} onChange={onChange} />
      <div className="mt-5 flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onClear}>Temizle</Button>
        <Button className="flex-1" onClick={onClose}>Sonuçları Göster</Button>
      </div>
    </Sheet>
  )
}
