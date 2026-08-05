import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, MapPin, Search, Trophy } from 'lucide-react'
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
      className="grid gap-2 rounded-[1.75rem] border border-slate-200/80 bg-white p-2.5 shadow-[0_24px_70px_-34px_rgba(15,23,42,0.35)] dark:border-ink-700 dark:bg-ink-900 sm:grid-cols-2 sm:p-3 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] lg:items-end"
    >
      <SearchField icon={Trophy} label="Ne oynayacaksın?">
        <Select
          aria-label="Spor türü"
          placeholder="Spor türü seç"
          value={sport}
          onChange={(event) => setSport(event.target.value)}
          className="h-10 border-0 bg-transparent px-0 pr-8 font-semibold shadow-none hover:border-0 focus:outline-none dark:bg-transparent"
          options={sortSportsByPriority(sports ?? []).map((item) => ({
            value: item.slug,
            label: item.name,
          }))}
        />
      </SearchField>
      <SearchField icon={MapPin} label="Nerede?">
        <Select
          aria-label="İl"
          placeholder="İl seç"
          value={city}
          className="h-10 border-0 bg-transparent px-0 pr-8 font-semibold shadow-none hover:border-0 focus:outline-none dark:bg-transparent"
          onChange={(event) => {
            setCity(event.target.value)
            setDistrict('')
          }}
          options={ALL_CITY_NAMES.map((name) => ({ value: name, label: name }))}
        />
      </SearchField>
      <SearchField icon={MapPin} label="Hangi ilçe?">
        <Select
          aria-label="İlçe"
          placeholder={districts.length > 0 ? 'İlçe seç' : 'Önce il seç'}
          value={district}
          className="h-10 border-0 bg-transparent px-0 pr-8 font-semibold shadow-none hover:border-0 focus:outline-none dark:bg-transparent"
          disabled={districts.length === 0}
          onChange={(event) => setDistrict(event.target.value)}
          options={districts.map((name) => ({ value: name, label: name }))}
        />
      </SearchField>
      <SearchField icon={CalendarDays} label="Ne zaman?">
        <DatePicker
          value={date}
          min={nowInIstanbul().date}
          placeholder="Tarih seç"
          onChange={setDate}
          className="h-10 border-0 bg-transparent px-0 shadow-none hover:border-0 hover:bg-transparent focus-visible:outline-none dark:bg-transparent dark:hover:border-0 dark:hover:bg-transparent [&>span:first-child]:hidden"
        />
      </SearchField>
      <Button
        type="submit"
        size="lg"
        className="h-14 w-full rounded-2xl px-6 shadow-none lg:h-[4.5rem] lg:w-auto"
      >
        <Search className="size-5" aria-hidden />
        Saha bul
      </Button>
    </form>
  )
}

function SearchField({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Trophy
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl px-3 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-ink-800/70 lg:border-r lg:border-slate-100 lg:px-4 dark:lg:border-ink-800">
      <p className="flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-ink-400">
        <Icon className="size-3.5 text-primary-600 dark:text-primary-400" aria-hidden />
        {label}
      </p>
      {children}
    </div>
  )
}
