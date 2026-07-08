import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ALL_CITY_NAMES, getDistricts } from '@/config/cities'
import { useSports } from '../hooks/useSports'
import type { VenueFilters } from '../types'

export interface VenueFilterFieldsProps {
  filters: VenueFilters
  onChange: (next: VenueFilters) => void
}

/** Filtre alanları — masaüstü panelde ve mobil Sheet içinde ortak kullanılır. */
export function VenueFilterFields({ filters, onChange }: VenueFilterFieldsProps) {
  const { data: sports } = useSports()
  const districts = getDistricts(filters.city ?? '')

  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Tesis adı"
        placeholder="Ara..."
        value={filters.q ?? ''}
        onChange={(event) => onChange({ ...filters, q: event.target.value || undefined })}
      />
      <Select
        label="Spor türü"
        placeholder="Tümü"
        value={filters.sport ?? ''}
        onChange={(event) => onChange({ ...filters, sport: event.target.value || undefined })}
        options={(sports ?? []).map((sport) => ({ value: sport.slug, label: sport.name }))}
      />
      <Select
        label="İl"
        placeholder="Tümü"
        value={filters.city ?? ''}
        onChange={(event) =>
          onChange({ ...filters, city: event.target.value || undefined, district: undefined })
        }
        options={ALL_CITY_NAMES.map((name) => ({ value: name, label: name }))}
      />
      <Select
        label="İlçe"
        placeholder={districts.length > 0 ? 'Tümü' : 'Önce il seçin'}
        value={filters.district ?? ''}
        disabled={districts.length === 0}
        onChange={(event) => onChange({ ...filters, district: event.target.value || undefined })}
        options={districts.map((name) => ({ value: name, label: name }))}
      />
    </div>
  )
}
