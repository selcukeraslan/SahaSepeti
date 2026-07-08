# SahaSepeti — Proje Kuralları

## Ürün Bağlamı

Türkiye için spor tesisi rezervasyon platformu (halı saha, basketbol, tenis, padel...). Kullanıcılar tesis arar, müsait saatleri görür, rezervasyon yapar. Tesis sahipleri panelden tesis/saha/fiyat/rezervasyon yönetir; admin tesisleri onaylar. Roller: `customer`, `venue_owner`, `admin`. Yol haritası: `TODO.md`.

**UI dili Türkçe, kod/DB İngilizce.** Gerçek ödeme entegre edilmez (payments tablosu placeholder).

## Mimari Kurallar

- Feature-bazlı yapı: `src/features/{auth,venues,reservations,dashboard,admin}` — her feature kendi `components/ hooks/ services/ types.ts` klasörlerini içerir.
- İş mantığı ve tüm Supabase çağrıları **yalnızca** `services/` katmanında. Bileşen içinde `supabase.from(...)` çağrısı yasak.
- Server state TanStack Query ile (`useQuery`/`useMutation` sarmalayan feature hookları). Global state yalnızca `AuthProvider`.
- Paylaşılan UI `src/components/ui`, layout `src/components/layout`. Feature'a özel bileşen feature klasöründe kalır.
- Route sayfaları `src/pages` — ince tutulur, mantık feature'lardan gelir.

## Kodlama Standartları

- TypeScript strict; **`any` yasak** (`unknown` + daraltma kullan). Tip üretimi: `database.types.ts`.
- DB yazma işlemlerinden önce zod şeması ile doğrulama; şemalar feature'ın `types.ts`/`schemas.ts` dosyasında.
- Bileşenler odaklı ve küçük; 200 satırı aşan bileşen bölünür.
- İsimlendirme: bileşen `PascalCase`, hook `useX`, servis `x.service.ts`, dosya adları kebab-case değil bileşen adıyla.
- Tarih/saat: date-fns + `tr` locale; tarih transferi `yyyy-MM-dd` string, saat `HH:mm`. Saat dilimi Europe/Istanbul; `new Date(dateString)` UTC tuzağına dikkat.
- Para: `Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' })`.

## Supabase & RLS

- Tüm tablolarda RLS açık; istemciye asla güvenilmez. Yeni tablo = migration + RLS politikası birlikte.
- Şema değişikliği yalnızca `supabase/migrations/` üzerinden; elle dashboard değişikliği yapılmaz.
- Çift rezervasyon DB seviyesinde engellenir (EXCLUDE constraint); uygulama 23P01 hatasını kullanıcı dostu mesaja çevirir.
- Fiyat asla istemciden alınmaz; `price_rules`'tan hesaplanır.
- Admin rolü yalnızca DB'den elle atanır.

## Tasarım / UX

- Premium, temiz, mobile-first. Generic Bootstrap/admin-template görünümü yasak.
- Palet: emerald primary, slate nötr, amber accent; rounded-2xl kartlar, yumuşak gölgeler, Inter.
- Her liste için skeleton + boş durum (EmptyState); her mutasyon için toast geri bildirimi.
- Net CTA'lar: "Rezervasyon Yap", "Müsait Saatleri Gör".

## Güvenlik & KVKK

- Kişisel veri minimum: ad, telefon, e-posta. Loglara kişisel veri yazılmaz.
- Rol korumalı route'lar hem UI'da hem RLS'te korunur (UI koruması tek başına yeterli sayılmaz).

## Komutlar

```bash
npm run dev          # geliştirme sunucusu
npm run build        # tsc + vite build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm test             # vitest
```

## Yapılmayacaklar

- Gerçek ödeme entegrasyonu (sadece placeholder).
- `any`, RLS'siz tablo, bileşen içinde iş mantığı/DB çağrısı.
- Kullanılmayan bağımlılık/soyutlama eklemek (MVP yalın kalır).
