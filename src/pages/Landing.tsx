import { ArrowRight, CalendarCheck2, ChevronRight, Search, ShieldCheck, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Seo } from '@/components/Seo'
import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { FeaturedVenueCarousel } from '@/features/venues/components/FeaturedVenueCarousel'
import { LandingHero } from '@/features/venues/components/LandingHero'
import { SportMark } from '@/features/venues/components/SportMark'
import { useSports } from '@/features/venues/hooks/useSports'
import { useVenues } from '@/features/venues/hooks/useVenues'
import { sortSportsByPriority } from '@/config/sports'
import { cn } from '@/lib/utils'

const STEPS = [
  {
    icon: Search,
    number: '01',
    title: 'Sporunu ve konumunu seç',
    text: 'Ne oynayacağını, nerede ve hangi gün oynamak istediğini belirle.',
  },
  {
    icon: CalendarCheck2,
    number: '02',
    title: 'Müsait saati yakala',
    text: 'Tesisleri karşılaştır, uygun sahayı ve saati belirle.',
  },
  {
    icon: Trophy,
    number: '03',
    title: 'Rezervasyonunu oluştur',
    text: 'Saatini ayır, takımını topla ve sahaya çık.',
  },
]

export function Landing() {
  const { data: sports, isLoading: sportsLoading } = useSports()
  const { data: venues, isLoading: venuesLoading } = useVenues({})
  const orderedSports = sortSportsByPriority(sports ?? [])

  return (
    <>
      <Seo title="SahaSepeti — Spor Tesisi Rezervasyonu" canonicalPath="/" />
      <LandingHero venues={venues ?? []} />
      <section className="bg-white py-16 dark:bg-ink-900 sm:py-24">
        <Container>
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">
                Oyunun ne?
              </p>
              <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-[-0.035em] text-slate-950 dark:text-white sm:text-4xl">
                Moduna uygun sahayı bul.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-slate-500 dark:text-ink-400">
              Favori sporunu seç, yakınındaki tesisleri ve müsait saatleri doğrudan gör.
            </p>
          </div>
          <div className="mt-9 grid grid-cols-2 gap-3 lg:grid-cols-12">
            {sportsLoading &&
              Array.from({ length: 7 }, (_, index) => (
                <Skeleton key={index} className="h-32 lg:col-span-3" />
              ))}
            {orderedSports.map((sport, index) => {
              const isPrimaryCard = index < 3
              return (
                <Link
                  key={sport.id}
                  to={`/tesisler?sport=${sport.slug}`}
                  className={cn(
                    'group relative min-h-32 overflow-hidden rounded-3xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg',
                    isPrimaryCard ? 'lg:col-span-4' : 'lg:col-span-3',
                    index === 0
                      ? 'border-primary-800 bg-primary-900 text-white'
                      : 'border-slate-200 bg-[#f7f8f4] text-slate-900 dark:border-ink-700 dark:bg-ink-800 dark:text-white',
                  )}
                >
                  <div className="flex items-start justify-between">
                    <SportMark
                      slug={sport.slug}
                      className="size-14 drop-shadow-sm transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110"
                    />
                    <ChevronRight className="size-5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" aria-hidden />
                  </div>
                  <p className="mt-4 font-semibold">{sport.name}</p>
                  {index === 0 && (
                    <span aria-hidden className="absolute -bottom-12 -right-8 size-32 rounded-full border-[18px] border-white/5" />
                  )}
                </Link>
              )
            })}
          </div>
        </Container>
      </section>

      <section className="border-y border-slate-200/70 bg-[#f4f5ef] py-16 dark:border-ink-800 dark:bg-ink-950 sm:py-24">
        <Container>
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">
                Keşfet
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-slate-950 dark:text-white sm:text-4xl">
                Öne çıkan tesisler
              </h2>
            </div>
            <Link
              to="/tesisler"
              className="hidden items-center gap-2 text-sm font-semibold text-slate-700 transition-colors hover:text-primary-700 dark:text-ink-200 dark:hover:text-primary-300 sm:flex"
            >
              Tüm tesisler
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          {venuesLoading ? (
            <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} className="h-80 rounded-3xl" />
              ))}
            </div>
          ) : (
            venues &&
            venues.length > 0 && (
              <div className="mt-9">
                <FeaturedVenueCarousel venues={venues} />
              </div>
            )
          )}
          {venues && venues.length === 0 && (
            <div className="mt-9 rounded-3xl border border-dashed border-slate-300 px-6 py-12 text-center text-slate-500 dark:border-ink-700 dark:text-ink-400">
              Yeni tesisler hazırlanıyor. Çok yakında burada olacaklar.
            </div>
          )}
          <Link to="/tesisler" className="mt-6 block sm:hidden">
            <Button variant="outline" className="w-full rounded-full">
              Tüm tesisleri gör
            </Button>
          </Link>
        </Container>
      </section>

      <section className="bg-ink-950 py-16 text-white sm:py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-400">Nasıl çalışır?</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                Maça giden en kısa yol.
              </h2>
              <p className="mt-4 max-w-sm leading-7 text-ink-300">
                Telefon trafiği ve uzun mesajlaşmalar olmadan, üç net adımda sahadasın.
              </p>
            </div>
            <div className="divide-y divide-white/10 border-y border-white/10">
              {STEPS.map((step) => (
                <div key={step.number} className="group grid grid-cols-[auto_1fr] gap-5 py-6 sm:grid-cols-[4rem_1fr_auto] sm:items-center">
                  <span className="font-mono text-sm text-primary-400">{step.number}</span>
                  <div>
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-ink-400">{step.text}</p>
                  </div>
                  <span className="hidden size-11 items-center justify-center rounded-full border border-white/10 text-ink-300 transition-colors group-hover:border-primary-500/40 group-hover:text-primary-300 sm:flex">
                    <step.icon className="size-5" aria-hidden />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-white py-16 dark:bg-ink-900 sm:py-24">
        <Container>
          <div className="relative overflow-hidden rounded-[2rem] bg-accent-400 px-6 py-12 text-slate-950 sm:px-12 sm:py-16 lg:px-16">
            <div aria-hidden className="absolute -right-20 -top-24 size-80 rounded-full border-[48px] border-slate-950/[0.06]" />
            <div aria-hidden className="absolute bottom-0 right-24 hidden h-2/3 w-px bg-slate-950/10 lg:block" />
            <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="max-w-2xl">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-950 text-accent-400">
                  <ShieldCheck className="size-5" aria-hidden />
                </div>
                <h2 className="mt-6 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                  Tesisiniz boş kalmasın.
                </h2>
                <p className="mt-4 max-w-xl text-base leading-7 text-slate-800/75">
                  Tesisinizi ücretsiz ekleyin, müsaitlik takviminizi yönetin ve yeni oyuncularla buluşun.
                </p>
              </div>
              <Link
                to="/kayit?rol=tesis"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-slate-950 px-6 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              >
                Tesisini ekle
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
