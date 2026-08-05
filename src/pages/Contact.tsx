import { useState, type FormEvent } from 'react'
import { Clock, Mail, MapPin, Phone, Send } from 'lucide-react'
import { Seo } from '@/components/Seo'
import { Container } from '@/components/layout/Container'
import { PublicPageHero } from '@/components/layout/PublicPageHero'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

const CONTACT_EMAIL = 'destek@sahasepeti.com'

const INFO = [
  { icon: Mail, label: 'E-posta', value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
  { icon: Phone, label: 'Telefon', value: '0850 000 00 00', href: 'tel:+908500000000' },
  { icon: MapPin, label: 'Adres', value: 'Türkiye' },
  { icon: Clock, label: 'Çalışma Saatleri', value: 'Hafta içi 09:00 – 18:00' },
]

export function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  // Backend/e-posta servisi henüz yok: form, kullanıcının kendi e-posta
  // istemcisini önceden doldurulmuş bir mesajla açar (dürüst MVP davranışı).
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const subject = encodeURIComponent(`SahaSepeti İletişim — ${name || 'Ziyaretçi'}`)
    const body = encodeURIComponent(`Ad: ${name}\nE-posta: ${email}\n\n${message}`)
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`
  }

  return (
    <>
      <Seo
        title="İletişim"
        description="SahaSepeti ile iletişime geçin — sorularınız, tesis ekleme talepleriniz ve destek için."
        canonicalPath="/iletisim"
      />
      <PublicPageHero
        title="İletişim"
        description="Soruların, önerilerin veya iş birliği talebin için bize yaz. En doğru yolu birlikte bulalım."
      />
      <section className="bg-[#fafbf8] py-12 dark:bg-ink-950 sm:py-16">
        <Container className="grid max-w-5xl gap-8 lg:grid-cols-[0.82fr_1.18fr]">
        {/* İletişim bilgileri */}
        <div className="space-y-3">
          {INFO.map((item) => {
            const content = (
              <div className="flex items-start gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 transition-colors hover:border-primary-200 dark:border-ink-700 dark:bg-ink-900">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-500/10 text-primary-600">
                  <item.icon className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="text-sm text-slate-500 dark:text-ink-400">{item.label}</p>
                  <p className="font-medium text-slate-900 dark:text-ink-50">{item.value}</p>
                </div>
              </div>
            )
            return item.href ? (
              <a key={item.label} href={item.href} className="block hover:opacity-80">
                {content}
              </a>
            ) : (
              <div key={item.label}>{content}</div>
            )
          })}
        </div>

        {/* İletişim formu */}
        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.4)] dark:border-ink-700 dark:bg-ink-900 sm:p-8"
        >
          <div className="flex flex-col gap-4">
            <Input
              label="Ad Soyad"
              placeholder="Adınız Soyadınız"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Input
              label="E-posta"
              type="email"
              placeholder="ornek@eposta.com"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Textarea
              label="Mesajınız"
              placeholder="Bize iletmek istediğiniz mesaj..."
              required
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            <Button type="submit" size="lg" className="rounded-full">
              <Send className="size-4" aria-hidden />
              Mesaj Gönder
            </Button>
            <p className="text-center text-xs text-slate-400 dark:text-ink-500">
              Gönder'e bastığında mesajın e-posta uygulamanda hazır olarak açılır.
            </p>
          </div>
        </form>
        </Container>
      </section>
    </>
  )
}
