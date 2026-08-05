import { Link } from 'react-router-dom'
import { CalendarCheck2, Clock, Search, ShieldCheck, Target, Users } from 'lucide-react'
import { Seo } from '@/components/Seo'
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
  { icon: Users, value: '81', label: 'İlde keşif' },
  { icon: Target, value: '7', label: 'Spor türü' },
  { icon: CalendarCheck2, value: '7/24', label: 'Tesis arama' },
]

export function About() {
  return (
    <>
      <Seo
        title="Biz Kimiz"
        description="SahaSepeti; spor tesisi rezervasyonunu kolaylaştıran, tesisleri ve sporcuları buluşturan Türkiye merkezli bir platformdur."
        canonicalPath="/hakkimizda"
      />
      <section className="relative overflow-hidden border-b border-slate-200/70 bg-[#f4f5ef] py-14 dark:border-ink-800 dark:bg-ink-950 sm:py-20">
        <div aria-hidden className="absolute -left-28 -top-28 size-80 rounded-full border-[48px] border-primary-600/[0.06]" />
        <Container className="relative grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="lg:border-r lg:border-slate-200 lg:pr-16 dark:lg:border-ink-800">
            <h1 className="text-4xl font-semibold tracking-[-0.045em] text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
              Biz Kimiz
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600 dark:text-ink-300">
              SahaSepeti, Türkiye'deki spor tesislerini oyuncularla buluşturan modern bir
              rezervasyon platformu. Amacımız saha aramayı ve rezervasyonu herkes için
              sadeleştirmek.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">
              Neden SahaSepeti?
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-slate-950 dark:text-white sm:text-4xl">
              Saha aramak oyundan zor olmamalı.
            </h2>
            <p className="mt-5 leading-7 text-slate-600 dark:text-ink-300">
              Halı saha, tenis kortu, basketbol sahası… Türkiye'de spor yapmak isteyen milyonlarca
              insan var; ama uygun sahayı bulmak, müsait saati öğrenmek ve yer ayırtmak çoğu zaman
              zahmetli. Biz bu süreci tek bir platformda topladık: oyuncular kolayca keşfedip
              rezervasyon yaparken, tesis sahipleri de dijital bir vitrine ve basit bir yönetim
              paneline kavuşuyor.
            </p>
          </div>
        </Container>
      </section>

      {/* Misyon */}
      <section className="bg-white py-16 dark:bg-ink-900 sm:py-24">
        <Container>
          {/* Değerler */}
          <div className="grid gap-5 sm:grid-cols-2">
            {VALUES.map((value) => (
              <div
                key={value.title}
                className="rounded-3xl border border-slate-200/80 bg-[#f7f8f4] p-6 dark:border-ink-700 dark:bg-ink-800"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-500/10 text-primary-600">
                  <value.icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-ink-50">{value.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-ink-400">{value.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* İstatistikler */}
      <section className="bg-primary-950 py-14 text-white">
        <Container>
          <div className="grid gap-6 sm:grid-cols-3">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center text-center">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-white/10 text-primary-300">
                  <stat.icon className="size-6" aria-hidden />
                </span>
                <p className="mt-3 text-3xl font-semibold">{stat.value}</p>
                <p className="text-sm text-ink-300">{stat.label}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-14 sm:py-20">
        <Container>
          <div className="mx-auto max-w-4xl rounded-[2rem] bg-accent-400 px-6 py-12 text-center text-slate-950 sm:px-12">
            <h2 className="text-3xl font-semibold tracking-[-0.035em]">Sahaya çıkmaya hazır mısın?</h2>
            <p className="mx-auto mt-3 max-w-md text-slate-800/70">
              İster oyna ister tesisini ekle — SahaSepeti seni bekliyor.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/tesisler">
                <Button size="lg" className="w-full rounded-full bg-slate-950 hover:bg-slate-800 sm:w-auto">
                  Saha Bul
                </Button>
              </Link>
              <Link to="/kayit?rol=tesis">
                <Button size="lg" variant="outline" className="w-full rounded-full border-slate-950 bg-transparent text-slate-950 hover:bg-slate-950 hover:text-white sm:w-auto">
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
