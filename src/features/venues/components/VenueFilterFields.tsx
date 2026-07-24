import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { AMENITIES } from '@/config/amenities'
import { ALL_CITY_NAMES, getDistricts } from '@/config/cities'
import { cn } from '@/lib/utils'
import { useSports } from '../hooks/useSports'
import { isCourtKind, type VenueFilters } from '../types'

export interface VenueFilterFieldsProps {
  filters: VenueFilters
  onChange: (next: VenueFilters) => void
}

const COURT_OPTIONS = [
  { value: 'indoor', label: 'Kapalı saha' },
  { value: 'outdoor', label: 'Açık saha' },
]

/** 08:00–22:00 arası saatlik müsaitlik seçenekleri. */
const TIME_OPTIONS = Array.from({ length: 15 }, (_, index) => {
  const time = `${String(8 + index).padStart(2, '0')}:00`
  return { value: time, label: time }
})

/** Filtre alanları — masaüstü panelde ve mobil Sheet içinde ortak kullanılır. */
export function VenueFilterFields({ filters, onChange }: VenueFilterFieldsProps) {
  const { data: sports } = useSports()
  const districts = getDistricts(filters.city ?? '')
  const selectedAmenities = filters.amenities ?? []

  const toggleAmenity = (amenity: string) => {
    const next = selectedAmenities.includes(amenity)
      ? selectedAmenities.filter((item) => item !== amenity)
      : [...selectedAmenities, amenity]
    onChange({ ...filters, amenities: next.length > 0 ? next : undefined })
  }

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

      <Select
        label="Saha türü"
        placeholder="Tümü"
        value={filters.court ?? ''}
        onChange={(event) => {
          const value = event.target.value
          onChange({ ...filters, court: isCourtKind(value) ? value : undefined })
        }}
        options={COURT_OPTIONS}
      />

      {/* Müsaitlik: tarih + saat */}
      <div>
        <span className="text-sm font-medium text-slate-700 dark:text-ink-200">Şu tarihte müsait</span>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          <input
            type="date"
            aria-label="Müsaitlik tarihi"
            value={filters.date ?? ''}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(event) => onChange({ ...filters, date: event.target.value || undefined })}
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 transition-colors hover:border-slate-400 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50 dark:hover:border-ink-600"
          />
          <Select
            aria-label="Müsaitlik saati"
            placeholder="Saat"
            value={filters.time ?? ''}
            onChange={(event) => onChange({ ...filters, time: event.target.value || undefined })}
            options={TIME_OPTIONS}
          />
        </div>
      </div>

      {/* Olanaklar */}
      <div>
        <span className="text-sm font-medium text-slate-700 dark:text-ink-200">Olanaklar</span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {AMENITIES.map((amenity) => {
            const isSelected = selectedAmenities.includes(amenity)
            return (
              <button
                key={amenity}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleAmenity(amenity)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  isSelected
                    ? 'border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300'
                    : 'border-slate-300 bg-white text-slate-600 hover:border-primary-400 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300',
                )}
              >
                {amenity}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
