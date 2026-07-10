import { Link } from 'react-router-dom'
import { CalendarCheck2, Clock, Search, ShieldCheck, Target, Users } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'

const VALUES = [
  {
    icon: Search,
    title: 'Kolay Keşif',
    text: 'Spor türü, il, ilçe ve tarihe göre yakınındaki tesisleri saniyeler içinde bul.',
  },
  {
    icon: Clock,
    title: 'Gerçek Zamanlı Müsaitlik',
    text: 'Sahaların dolu-boş durumunu anlık gör, boşuna telefon trafiğiyle uğraşma.',
  },
  {
    icon: ShieldCheck,
    title: 'Güvenli Rezervasyon',
    text: 'Çift rezervasyon imkânsız; seçtiğin saat sana ayrılır, sürprizle karşılaşmazsın.',
  },
  {
    icon: CalendarCheck2,
    title: 'Tek Panelden Yönetim',
    text: 'Tesis sahipleri sahalarını, fiyatlarını ve rezervasyonlarını tek yerden yönetir.',
  },
]

const STATS = [
  { icon: Users, value: 'Binlerce', label: 'Oyuncu' },
  { icon: Target, value: '5+', label: 'Spor Türü' },
  { icon: CalendarCheck2, value: '7/24', label: 'Online Rezervasyon' },
]

export function About() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-primary-100">
              Biz Kimiz
            </span>
            <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
              Sahayı bulmak hiç bu kadar kolay olmamıştı
            </h1>
            <p className="mt-4 text-lg text-primary-100">
              SahaSepeti, Türkiye'deki spor tesislerini oyuncularla buluşturan modern bir
              rezervasyon platformudur. Amacımız, saha aramayı ve rezervasyon yapmayı telefon
              trafiğinden kurtarıp herkes için birkaç dokunuşla halledilir hâle getirmek.
            </p>
          </div>
        </Container>
      </section>

      {/* Misyon */}
      <section className="py-14 sm:py-20">
        <Container>
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-ink-50">Neden SahaSepeti?</h2>
            <p className="mt-3 leading-relaxed text-slate-600 dark:text-ink-300">
              Halı saha, tenis kortu, basketbol sahası… Türkiye'de spor yapmak isteyen milyonlarca
              insan var; ama uygun sahayı bulmak, müsait saati öğrenmek ve yer ayırtmak çoğu zaman
              zahmetli. Biz bu süreci tek bir platformda topladık: oyuncular kolayca keşfedip
              rezervasyon yaparken, tesis sahipleri de dijital bir vitrine ve basit bir yönetim
              paneline kavuşuyor.
            </p>
          </div>

          {/* Değerler */}
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {VALUES.map((value) => (
              <div
                key={value.title}
                className="rounded-2xl border border-slate-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-6 shadow-soft"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-500/10 text-primary-600">
                  <value.icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold text-slate-900 dark:text-ink-50">{value.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-ink-400">{value.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* İstatistikler */}
      <section className="bg-white dark:bg-ink-900 py-14">
        <Container>
          <div className="grid gap-6 sm:grid-cols-3">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center text-center">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-500/10 text-primary-600">
                  <stat.icon className="size-6" aria-hidden />
                </span>
                <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-ink-50">{stat.value}</p>
                <p className="text-sm text-slate-500 dark:text-ink-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-14 sm:py-20">
        <Container>
          <div className="mx-auto max-w-2xl rounded-3xl bg-ink-900 px-6 py-10 text-center sm:px-12">
            <h2 className="text-2xl font-bold text-white">Hazır mısın?</h2>
            <p className="mx-auto mt-2 max-w-md text-ink-200">
              İster oyna ister tesisini ekle — SahaSepeti seni bekliyor.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/tesisler">
                <Button size="lg" className="w-full sm:w-auto">
                  Saha Bul
                </Button>
              </Link>
              <Link to="/kayit?rol=tesis">
                <Button size="lg" className="w-full sm:w-auto">
                  Tesisini Ekle
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
