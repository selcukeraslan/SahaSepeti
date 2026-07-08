# SahaSepeti ⚽

Türkiye için modern spor tesisi rezervasyon platformu. Halı saha, basketbol, tenis, padel ve daha fazlası — tesisi bul, müsait saati seç, rezervasyonunu yap.

## Özellikler

- 🔍 Spor türü, il, ilçe ve tarihe göre tesis arama
- 📅 Saha bazlı gerçek zamanlı müsaitlik ve saatlik slot görünümü
- 🛡️ DB seviyesinde çift rezervasyon engeli (EXCLUDE constraint)
- 💰 Sunucu tarafı fiyat hesabı (istemciye güvenilmez)
- 🏟️ Tesis sahibi paneli: tesis/saha/fiyat/çalışma saati/rezervasyon yönetimi
- ✅ Admin paneli: tesis onay kuyruğu, askıya alma, rezervasyon görünümü
- 🖼️ Supabase Storage ile görsel yükleme
- 🔒 Tüm tablolarda Row Level Security

## Teknoloji

Vite · React · TypeScript (strict) · Supabase (Auth + Postgres + Storage + RLS) · TanStack Query · React Router · react-hook-form + zod · Tailwind CSS v4 · date-fns

## Kurulum

### 1. Bağımlılıklar

```bash
npm install
```

### 2. Supabase projesi

1. [supabase.com](https://supabase.com) üzerinde yeni bir proje oluşturun.
2. SQL Editor'da migration'ları **sırayla** çalıştırın:
   - `supabase/migrations/001_schema.sql`
   - `supabase/migrations/002_functions_triggers.sql`
   - `supabase/migrations/003_rls.sql`
   - `supabase/migrations/004_storage.sql`
3. Seed verisini yükleyin: `supabase/seed.sql`
   - Üretimde yalnızca **Sporlar** bölümünü çalıştırın; demo kullanıcılar/tesisler sadece geliştirme içindir.

> Supabase CLI kullanıyorsanız: `supabase db push` + `supabase db seed` da çalışır.

### 3. Ortam değişkenleri

```bash
cp .env.example .env
```

`.env` dosyasına Supabase proje bilgilerinizi girin (Project Settings → API):

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 4. Çalıştırma

```bash
npm run dev
```

## Demo hesaplar (seed sonrası)

| Rol | E-posta | Şifre |
|---|---|---|
| Tesis sahibi | `owner@demo.sahasepeti.dev` | `demo1234` |
| Admin | `admin@demo.sahasepeti.dev` | `demo1234` |
| Müşteri | `musteri@demo.sahasepeti.dev` | `demo1234` |

> Not: Supabase projenizde **Authentication → Providers → Email → Confirm email** kapalı olmalı ya da demo kullanıcıları seed ile yüklemelisiniz (seed'dekiler onaylı gelir).

## Komutlar

```bash
npm run dev          # geliştirme sunucusu
npm run build        # üretim derlemesi (tsc + vite)
npm run typecheck    # tip kontrolü
npm run lint         # oxlint
npm test             # vitest (slot üretim motoru testleri)
```

## Proje yapısı

```
src/
  app/            # providers, router, guards
  pages/          # route seviyesi sayfalar (public / panel / admin)
  features/       # auth, venues, reservations, dashboard, admin
  components/     # ui kit + layout
  lib/            # supabase client, format helpers
  config/         # sporlar, il/ilçe, olanaklar
supabase/
  migrations/     # SQL şema + RLS
  seed.sql        # sporlar + demo veri
```

Detaylı yol haritası için [TODO.md](TODO.md), geliştirme kuralları için [CLAUDE.md](CLAUDE.md) dosyasına bakın.

## Roller

- **customer** — tesis arar, rezervasyon yapar, iptal eder
- **venue_owner** — tesis/saha/fiyat yönetir, rezervasyon onaylar/reddeder
- **admin** — tesisleri onaylar/askıya alır (yalnızca DB'den elle atanır)

## Bilinen kapsam sınırları (MVP)

- Online ödeme yok — `payments` tablosu placeholder (iyzico/PayTR için hazır)
- Yorum ve favoriler şemada hazır, UI'da henüz yok
- Bildirim (e-posta/SMS) yok

Yol haritasının tamamı: [TODO.md → Phase 11](TODO.md)
