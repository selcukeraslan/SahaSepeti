import { useState, type FormEvent } from 'react'
import { Clock, Mail, MapPin, Phone, Send } from 'lucide-react'
import { Seo } from '@/components/Seo'
import { Container } from '@/components/layout/Container'
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
    <Container className="py-12 sm:py-16">
      <Seo
        title="İletişim"
        description="SahaSepeti ile iletişime geçin — sorularınız, tesis ekleme talepleriniz ve destek için."
        canonicalPath="/iletisim"
      />
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-ink-50 sm:text-4xl">İletişim</h1>
        <p className="mt-3 text-slate-500 dark:text-ink-400">
          Sorusu, önerisi veya iş birliği talebi olan herkese kapımız açık. Aşağıdaki formu
          doldur ya da doğrudan bize ulaş.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl gap-8 lg:grid-cols-[1fr_1.2fr]">
        {/* İletişim bilgileri */}
        <div className="space-y-3">
          {INFO.map((item) => {
            const content = (
              <div className="flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4 shadow-soft">
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
          className="rounded-3xl border border-slate-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-6 shadow-soft"
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
            <Button type="submit" size="lg">
              <Send className="size-4" aria-hidden />
              Mesaj Gönder
            </Button>
            <p className="text-center text-xs text-slate-400 dark:text-ink-500">
              Gönder'e bastığında mesajın e-posta uygulamanda hazır olarak açılır.
            </p>
          </div>
        </form>
      </div>
    </Container>
  )
}
