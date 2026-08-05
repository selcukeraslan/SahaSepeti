import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'
import { Select } from '@/components/ui/Select'
import { ALL_CITY_NAMES, getDistricts } from '@/config/cities'
import { sortSportsByPriority } from '@/config/sports'
import { nowInIstanbul } from '../services/slots'
import { useSports } from '../hooks/useSports'

/** Landing hero'sundaki arama kutusu — /tesisler sayfasına yönlendirir. */
export function VenueSearchBox() {
  const navigate = useNavigate()
  const { data: sports } = useSports()
  const [sport, setSport] = useState('')
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [date, setDate] = useState('')

  const districts = getDistricts(city)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const params = new URLSearchParams()
    if (sport) params.set('sport', sport)
    if (city) params.set('city', city)
    if (district) params.set('district', district)
    if (date) params.set('date', date)
    navigate(`/tesisler?${params.toString()}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft-lg dark:border-ink-800 dark:bg-ink-900 sm:grid-cols-2 lg:grid-cols-5"
    >
      <Select
        aria-label="Spor türü"
        placeholder="Spor türü"
        value={sport}
        onChange={(event) => setSport(event.target.value)}
        className="h-12 text-base"
        options={sortSportsByPriority(sports ?? []).map((item) => ({
          value: item.slug,
          label: item.name,
        }))}
      />
      <Select
        aria-label="İl"
        placeholder="İl seçin"
        value={city}
        className="h-12 text-base"
        onChange={(event) => {
          setCity(event.target.value)
          setDistrict('')
        }}
        options={ALL_CITY_NAMES.map((name) => ({ value: name, label: name }))}
      />
      <Select
        aria-label="İlçe"
        placeholder={districts.length > 0 ? 'İlçe seçin' : 'Önce il seçin'}
        value={district}
        className="h-12 text-base"
        disabled={districts.length === 0}
        onChange={(event) => setDistrict(event.target.value)}
        options={districts.map((name) => ({ value: name, label: name }))}
      />
      <DatePicker
        value={date}
        min={nowInIstanbul().date}
        onChange={setDate}
      />
      <Button type="submit" size="lg" className="w-full">
        <Search className="size-4" aria-hidden />
        Saha Bul
      </Button>
    </form>
  )
}
