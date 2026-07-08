import { Link } from 'react-router-dom'
import { CalendarCheck2, MapPinned, Search, Trophy } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { VenueSearchBox } from '@/features/venues/components/VenueSearchBox'
import { VenueCard } from '@/features/venues/components/VenueCard'
import { useSports } from '@/features/venues/hooks/useSports'
import { useVenues } from '@/features/venues/hooks/useVenues'
import { getSportIcon } from '@/config/sports'

export function Landing() {
  const { data: sports, isLoading: sportsLoading } = useSports()
  const { data: venues, isLoading: venuesLoading } = useVenues({})

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 pb-20 pt-16 sm:pb-28 sm:pt-24">
        <div
          aria-hidden
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, white 1.5px, transparent 1.5px), radial-gradient(circle at 80% 70%, white 1.5px, transparent 1.5px)',
            backgroundSize: '48px 48px',
          }}
        />
        <Container className="relative">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Sahanı Seç, <span className="text-accent-400">Maçını Kur</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-primary-100">
              Halı saha, tenis kortu, basketbol sahası ve daha fazlası. Yakınındaki tesisleri
              keşfet, müsait saati seç, saniyeler içinde rezervasyon yap.
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-4xl">
            <VenueSearchBox />
          </div>
        </Container>
      </section>

      {/* Spor kategorileri */}
      <section className="py-14 sm:py-20">
        <Container>
          <h2 className="text-2xl font-bold text-slate-900">Spor Türleri</h2>
          <p className="mt-1 text-slate-500">Hangi sporu yapmak istiyorsun?</p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {sportsLoading &&
              Array.from({ length: 7 }, (_, index) => (
                <Skeleton key={index} className="h-24" />
              ))}
            {sports?.map((sport) => {
              const Icon = getSportIcon(sport.slug)
              return (
                <Link
                  key={sport.id}
                  to={`/tesisler?sport=${sport.slug}`}
                  className="group flex flex-col items-center gap-2.5 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-soft-lg"
                >
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-600 group-hover:text-white">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="text-sm font-medium text-slate-700">{sport.name}</span>
                </Link>
              )
            })}
          </div>
        </Container>
      </section>

      {/* Öne çıkan tesisler */}
      <section className="bg-white py-14 sm:py-20">
        <Container>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Öne Çıkan Tesisler</h2>
              <p className="mt-1 text-slate-500">En yeni eklenen tesislere göz at</p>
            </div>
            <Link to="/tesisler" className="hidden sm:block">
              <Button variant="outline" size="sm">
                Tümünü Gör
              </Button>
            </Link>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {venuesLoading &&
              Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-72" />)}
            {venues?.slice(0, 6).map((venue) => <VenueCard key={venue.id} venue={venue} />)}
          </div>
          {venues && venues.length === 0 && (
            <p className="mt-6 text-center text-slate-500">
              Henüz tesis eklenmemiş — çok yakında burada olacaklar!
            </p>
          )}
          <div className="mt-6 sm:hidden">
            <Link to="/tesisler">
              <Button variant="outline" className="w-full">
                Tüm Tesisleri Gör
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* Nasıl çalışır */}
      <section className="py-14 sm:py-20">
        <Container>
          <h2 className="text-center text-2xl font-bold text-slate-900">Nasıl Çalışır?</h2>
          <div className="mx-auto mt-8 grid max-w-4xl gap-6 sm:grid-cols-3">
            {[
              {
                icon: Search,
                title: '1. Ara',
                text: 'Spor türü, il ve ilçeye göre yakınındaki tesisleri keşfet.',
              },
              {
                icon: MapPinned,
                title: '2. Seç',
                text: 'Tesisi incele, sahayı ve sana uyan müsait saati seç.',
              },
              {
                icon: CalendarCheck2,
                title: '3. Rezerve Et',
                text: 'Saniyeler içinde rezervasyonunu oluştur, sahaya gel ve oyna.',
              },
            ].map((step) => (
              <div key={step.title} className="flex flex-col items-center text-center">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                  <step.icon className="size-6" aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-1.5 text-sm text-slate-500">{step.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Tesis sahibi CTA */}
      <section className="pb-14 sm:pb-20">
        <Container>
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-12 text-center sm:px-12 sm:py-16">
            <div
              aria-hidden
              className="absolute inset-0 opacity-20"
              style={{
                background:
                  'radial-gradient(ellipse at top right, rgb(16 185 129 / 0.5), transparent 60%)',
              }}
            />
            <div className="relative">
              <Trophy className="mx-auto size-10 text-accent-400" aria-hidden />
              <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
                Tesis Sahibi misiniz?
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-slate-300">
                Tesisinizi SahaSepeti'ne ekleyin, rezervasyonlarınızı tek panelden yönetin ve
                doluluk oranınızı artırın. Üstelik tamamen ücretsiz.
              </p>
              <Link to="/kayit?rol=tesis" className="mt-6 inline-block">
                <Button size="lg" className="bg-accent-500 hover:bg-accent-600 active:bg-accent-600">
                  Tesisinizi Ekleyin
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
