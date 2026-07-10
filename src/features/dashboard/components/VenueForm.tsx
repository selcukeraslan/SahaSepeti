import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { AMENITIES } from '@/config/amenities'
import { ALL_CITY_NAMES, getDistricts } from '@/config/cities'
import { useSports } from '@/features/venues/hooks/useSports'
import { cn } from '@/lib/utils'
import { venueSchema, type VenueInput } from '../schemas'

export interface VenueFormProps {
  defaultValues?: VenueInput
  isSaving: boolean
  submitLabel: string
  onSubmit: (data: VenueInput) => void
}

const EMPTY_VALUES: VenueInput = {
  name: '',
  description: '',
  city: '',
  district: '',
  address: '',
  phone: '',
  amenities: [],
  sportIds: [],
}

export function VenueForm({ defaultValues, isSaving, submitLabel, onSubmit }: VenueFormProps) {
  const { data: sports } = useSports()
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VenueInput>({
    resolver: zodResolver(venueSchema),
    defaultValues: defaultValues ?? EMPTY_VALUES,
  })

  const city = watch('city')
  const selectedSports = watch('sportIds')
  const selectedAmenities = watch('amenities')
  const districts = getDistricts(city)

  const toggleSport = (sportId: string) => {
    const next = selectedSports.includes(sportId)
      ? selectedSports.filter((id) => id !== sportId)
      : [...selectedSports, sportId]
    setValue('sportIds', next, { shouldValidate: true })
  }

  const toggleAmenity = (amenity: string) => {
    const next = selectedAmenities.includes(amenity)
      ? selectedAmenities.filter((item) => item !== amenity)
      : [...selectedAmenities, amenity]
    setValue('amenities', next)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <Input
        label="Tesis Adı"
        placeholder="Örn. Yeşilvadi Spor Kompleksi"
        error={errors.name?.message}
        {...register('name')}
      />
      <Textarea
        label="Açıklama"
        placeholder="Tesisinizi tanıtın: zemin, aydınlatma, ulaşım..."
        error={errors.description?.message}
        {...register('description')}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="İl"
          placeholder="İl seçin"
          error={errors.city?.message}
          options={ALL_CITY_NAMES.map((name) => ({ value: name, label: name }))}
          {...register('city', {
            onChange: () => setValue('district', ''),
          })}
        />
        {districts.length > 0 ? (
          <Select
            label="İlçe"
            placeholder="İlçe seçin"
            error={errors.district?.message}
            options={districts.map((name) => ({ value: name, label: name }))}
            {...register('district')}
          />
        ) : (
          <Input
            label="İlçe"
            placeholder="İlçe adı"
            error={errors.district?.message}
            {...register('district')}
          />
        )}
      </div>

      <Input
        label="Adres"
        placeholder="Mahalle, cadde, no"
        error={errors.address?.message}
        {...register('address')}
      />
      <Input
        label="Telefon (isteğe bağlı)"
        type="tel"
        placeholder="0212 555 00 00"
        error={errors.phone?.message}
        {...register('phone')}
      />

      {/* Spor türleri */}
      <fieldset>
        <legend className="text-sm font-medium text-slate-700 dark:text-slate-200">Spor Türleri</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {sports?.map((sport) => {
            const isSelected = selectedSports.includes(sport.id)
            return (
              <button
                key={sport.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleSport(sport.id)}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                  isSelected
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-primary-400',
                )}
              >
                {sport.name}
              </button>
            )
          })}
        </div>
        {errors.sportIds && <p className="mt-1.5 text-sm text-red-600">{errors.sportIds.message}</p>}
      </fieldset>

      {/* Olanaklar */}
      <fieldset>
        <legend className="text-sm font-medium text-slate-700 dark:text-slate-200">Olanaklar</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {AMENITIES.map((amenity) => {
            const isSelected = selectedAmenities.includes(amenity)
            return (
              <button
                key={amenity}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleAmenity(amenity)}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                  isSelected
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-primary-400',
                )}
              >
                {amenity}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="flex justify-end">
        <Button type="submit" size="lg" isLoading={isSaving}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
