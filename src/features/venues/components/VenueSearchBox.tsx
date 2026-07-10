import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { ALL_CITY_NAMES, getDistricts } from '@/config/cities'
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
      className="grid gap-3 rounded-2xl border border-slate-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4 shadow-soft-lg sm:grid-cols-2 lg:grid-cols-5"
    >
      <Select
        aria-label="Spor türü"
        placeholder="Spor türü"
        value={sport}
        onChange={(event) => setSport(event.target.value)}
        options={(sports ?? []).map((item) => ({ value: item.slug, label: item.name }))}
      />
      <Select
        aria-label="İl"
        placeholder="İl seçin"
        value={city}
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
        disabled={districts.length === 0}
        onChange={(event) => setDistrict(event.target.value)}
        options={districts.map((name) => ({ value: name, label: name }))}
      />
      <input
        type="date"
        aria-label="Tarih"
        value={date}
        min={nowInIstanbul().date}
        onChange={(event) => setDate(event.target.value)}
        className="h-11 rounded-xl border border-slate-300 dark:border-ink-700 bg-white dark:bg-ink-900 px-3.5 text-sm text-slate-900 dark:text-ink-50 transition-colors hover:border-slate-400 dark:hover:border-ink-600 focus:outline-2 focus:outline-offset--1 focus:outline-primary-600"
      />
      <Button type="submit" size="md" className="w-full">
        <Search className="size-4" aria-hidden />
        Saha Bul
      </Button>
    </form>
  )
}
