# SahaSepeti — MVP Yol Haritası (TODO)

## Proje Özeti

SahaSepeti, Türkiye için modern bir spor tesisi rezervasyon platformudur (olleyy.com ürün referansı; tasarım kopyalanmaz).

- Kullanıcılar spor türü, il, ilçe, tarih ve saate göre tesis arar.
- Tesis detayında sahaları/kortları ve müsait saatleri görür, online rezervasyon yapar.
- Tesis sahipleri basit bir panelden tesis, saha, çalışma saati, fiyat ve rezervasyon yönetir.
- Admin tesisleri onaylar/reddeder, rezervasyonları görür.
- Ödeme ŞİMDİLİK yok (placeholder tablo); ileride iyzico/PayTR entegrasyonuna hazır.

## Teknoloji Yığını

| Katman | Seçim |
|---|---|
| Build | Vite + React + TypeScript (strict, `any` yasak) |
| Routing | React Router v6 |
| Server state | TanStack Query |
| Backend | Supabase (Auth + Postgres + Storage + RLS) |
| Stil | Tailwind CSS + özel design-token katmanı |
| Form | react-hook-form + zod |
| Tarih | date-fns (tr locale) |
| İkon | lucide-react |
| Global state | Sadece Auth için React Context (ekstra kütüphane yok) |

## Klasör Yapısı

```
src/
  app/            → providers (Auth, QueryClient), router, App.tsx
  pages/          → route seviyesi sayfalar
  features/
    auth/         → components/ hooks/ services/ types.ts
    venues/
    reservations/
    dashboard/    → tesis sahibi paneli
    admin/
  components/
    ui/           → Button, Input, Select, Card, Badge, Dialog, Sheet, Toast, Skeleton, EmptyState, Tabs...
    layout/       → Header, Footer, MobileNav, Container, PageShell
  lib/            → supabase client, queryClient, cn(), format helpers
  hooks/          → paylaşılan hooklar
  types/          → database.types.ts (generated) + global tipler
  config/         → sports, il/ilçe, amenities sabitleri
  styles/         → global.css
supabase/
  migrations/     → SQL migration dosyaları
  seed.sql        → sports + demo veriler
```

## Veri Modeli (12 tablo)

Tüm tablolarda `id uuid PK (gen_random_uuid)`, `created_at/updated_at timestamptz`.

1. **profiles** — id (auth.users FK, PK), full_name, phone, avatar_url, role (`user_role`)
2. **venues** — owner_id, name, slug (unique), description, city, district, address, latitude, longitude, phone, cover_image_url, amenities (text[]), status (`venue_status`), rejection_reason
3. **venue_images** — venue_id, storage_path, url, sort_order
4. **sports** — name, slug, icon (seed: Halı Saha, Basketbol, Tenis, Voleybol, Padel, Badminton, Squash)
5. **venue_sports** — venue_id + sport_id (composite PK)
6. **courts** — venue_id, sport_id, name, surface_type, is_indoor, capacity, is_active
7. **opening_hours** — venue_id, day_of_week (0-6), open_time, close_time, is_closed
8. **price_rules** — court_id, day_of_week (nullable = tüm günler), start_time, end_time, price, currency (TRY)
9. **reservations** — court_id, venue_id (denormalize), customer_id, reservation_date, start_time, end_time, status (`reservation_status`), total_price, deposit_amount, notes, cancelled_at, cancellation_reason
10. **payments** (placeholder) — reservation_id, amount, type (`payment_type`), status (`payment_status`), provider, provider_ref
11. **reviews** (placeholder) — venue_id, customer_id, reservation_id, rating (1-5), comment
12. **favorites** (placeholder) — customer_id + venue_id (composite PK)

**Enumlar:** `user_role` (customer|venue_owner|admin), `venue_status` (draft|pending|approved|rejected|suspended), `reservation_status` (pending|confirmed|cancelled|completed), `payment_type` (deposit|full), `payment_status` (pending|paid|refunded|failed)

**Yardımcı SQL (security definer):** `is_admin()`, `owns_venue(venue_id)` — RLS politikalarında kullanılır.

**Çift rezervasyon önleme:** `btree_gist` uzantısı + EXCLUDE constraint (aynı court + tarih içinde saat aralığı çakışması DB seviyesinde engellenir). Yalnızca `cancelled` olmayan rezervasyonlar kısıta dahildir.

## Ortam Değişkenleri (.env)

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Genel İlkeler & Kalite Kuralları

- TypeScript strict; `any` yasak.
- İş mantığı `features/*/services` içinde; bileşenlerde tekrar edilmez.
- DB işlemi öncesi zod doğrulaması.
- Tüm tablolarda RLS açık; istemciye güvenilmez.
- Premium, temiz, mobile-first tasarım; generic admin-template görünümü yasak.
- Gerçek ödeme entegre EDİLMEZ (placeholder ile geleceğe hazırlık).
- UI dili Türkçe; kod/veritabanı İngilizce.

## Faz İndeksi

| Faz | Başlık | Durum |
|---|---|---|
| 0 | Proje Denetimi & Kurulum | ✅ |
| 1 | Supabase Şema & Auth Planı | ✅ |
| 2 | Temel Layout & Design System | ✅ |
| 3 | Public Sayfalar | ✅ |
| 4 | Tesis Detay & Uygunluk | ✅ |
| 5 | Rezervasyon Akışı | ✅ |
| 6 | Tesis Sahibi Paneli | ✅ |
| 7 | Admin Paneli | ✅ |
| 8 | Storage, Görseller & Polish | ✅ |
| 9 | RLS, Doğrulama & Güvenlik | ✅ |
| 10 | Test, Bug Fix & MVP Temizlik | ✅ |
| 11 | Gelecek Yol Haritası | 🔄 devam ediyor |

---

### Phase 0 — Proje Denetimi & Kurulum

- **Amaç:** Boş dizinden çalışan bir Vite + React + TS + Tailwind iskeleti çıkarmak.
- **Görevler:**
  - Vite `react-ts` şablonu ile proje oluştur.
  - Bağımlılıkları kur: `@supabase/supabase-js`, `@tanstack/react-query`, `react-router-dom`, `react-hook-form`, `zod`, `@hookform/resolvers`, `date-fns`, `lucide-react`, `tailwindcss`.
  - `tsconfig` strict + path alias (`@/` → `src/`).
  - Klasör yapısını oluştur; `lib/supabase.ts`, `lib/queryClient.ts`, `lib/utils.ts` (cn) yaz.
  - `.env.example` + `.gitignore` + `git init`.
- **Kabul Kriterleri:** `npm run dev` çalışır, `npm run build` + typecheck hatasız, klasör yapısı hazır.
- **Dokunulacak Dosyalar:** kök konfig dosyaları, `src/lib/*`, `src/styles/global.css`.
- **Riskler/Notlar:** Tailwind v4 CSS-first konfig kullanılır (`@theme`); ayrı config dosyası gerekmez.

### Phase 1 — Supabase Şema & Auth Planı

- **Amaç:** Tüm veri modelini migration olarak yazmak; auth + profil oluşturma akışını kurmak.
- **Görevler:**
  - `supabase/migrations/` altında: enumlar, 12 tablo, indexler, `btree_gist` EXCLUDE constraint, `updated_at` trigger.
  - `handle_new_user()` trigger: auth.users insert → profiles satırı (metadata'dan full_name + role).
  - `is_admin()`, `owns_venue()` fonksiyonları.
  - Temel RLS politikaları (Phase 9'da sıkılaştırılır).
  - `seed.sql`: sports + demo tesis/saha/fiyat verisi.
  - `src/types/database.types.ts` (şemadan türetilmiş tipler).
  - AuthProvider (Context) + `useAuth` hook + signup/login/logout servisleri.
- **Kabul Kriterleri:** Migration'lar temiz bir Supabase projesine hatasız uygulanır; kayıt olan kullanıcıya otomatik profil oluşur; rol bilgisi okunur.
- **Dokunulacak Dosyalar:** `supabase/migrations/*`, `supabase/seed.sql`, `src/types/database.types.ts`, `src/features/auth/*`, `src/app/providers/AuthProvider.tsx`.
- **Riskler/Notlar:** EXCLUDE constraint'te `WHERE (status != 'cancelled')` şartı unutulmamalı; aksi halde iptal edilen slot tekrar satılamaz.

### Phase 2 — Temel Layout & Design System

- **Amaç:** Premium, mobile-first görsel dil ve yeniden kullanılabilir UI kit.
- **Görevler:**
  - Design tokenlar: emerald primary + slate nötr + amber accent, radius (2xl), soft shadow, Inter font.
  - `components/ui/`: Button (variant/size), Input, Select, Textarea, Card, Badge, Dialog, Sheet, Toast, Skeleton, EmptyState, Tabs, Spinner.
  - `components/layout/`: Header (logo, nav, auth durumu), Footer, MobileNav, Container, PageShell.
  - Router iskeleti: tüm route'lar placeholder sayfalarla.
- **Kabul Kriterleri:** Tüm UI bileşenleri tek tip görünür; mobil/masaüstü header düzgün; route'lar gezilebilir.
- **Dokunulacak Dosyalar:** `src/components/*`, `src/app/router.tsx`, `src/styles/global.css`.
- **Riskler/Notlar:** Generic Bootstrap görünümünden kaçın; boşluk/tipografi cömert olsun.

### Phase 3 — Public Sayfalar

- **Amaç:** Landing + tesis listeleme + arama/filtreler.
- **Görevler:**
  - Landing: hero + arama kutusu (spor, il, ilçe, tarih), spor kategorileri, öne çıkan tesisler, nasıl çalışır, CTA.
  - Tesis listesi: filtre paneli (mobilde Sheet), tesis kartları (görsel, isim, konum, spor rozetleri, fiyat "başlangıç"), skeleton + boş durum.
  - Filtreler URL query param ile senkron (paylaşılabilir link).
  - `venues.service.ts`: approved tesisleri filtreli listeleyen sorgular; `useVenues` hook.
- **Kabul Kriterleri:** Filtre kombinasyonları doğru sonuç verir; mobilde kusursuz; URL paylaşılabilir.
- **Dokunulacak Dosyalar:** `src/pages/{Landing,VenueList}.tsx`, `src/features/venues/*`, `src/config/{sports,cities,amenities}.ts`.
- **Riskler/Notlar:** İl/ilçe verisi statik config'ten gelir (81 il + büyük ilçeler); DB'ye taşımak MVP için gereksiz.

### Phase 4 — Tesis Detay & Uygunluk

- **Amaç:** Tesis detay sayfası ve saat bazlı müsaitlik görünümü.
- **Görevler:**
  - Detay sayfası: görsel galerisi, açıklama, olanaklar, sporlar, adres, çalışma saatleri, saha listesi.
  - Slot üretimi (`availability.service.ts`): seçilen tarih + saha için `opening_hours`'tan saatlik slotlar üretilir; mevcut rezervasyonlarla çakışanlar "dolu", geçmiş saatler "kapalı" işaretlenir; fiyat `price_rules`'tan eşlenir.
  - Tarih seçici (bugün + 14 gün) + saha sekmeli slot ızgarası.
- **Kabul Kriterleri:** Slotlar çalışma saatine, rezervasyonlara ve fiyat kurallarına göre doğru; geçmiş saat seçilemez.
- **Dokunulacak Dosyalar:** `src/pages/VenueDetail.tsx`, `src/features/venues/services/availability.service.ts`, ilgili bileşenler.
- **Riskler/Notlar:** Slot üretimi saf fonksiyon olarak yazılır (test edilebilir); saat dilimi Europe/Istanbul, tarih string (`yyyy-MM-dd`) olarak taşınır — UTC kaymasına dikkat.

### Phase 5 — Rezervasyon Akışı

- **Amaç:** Slot seçiminden onaylı rezervasyona uçtan uca akış.
- **Görevler:**
  - Rezervasyon özeti dialog'u: tesis/saha/tarih/saat/fiyat + not alanı; giriş yoksa login'e yönlendir (dönüşte akışa devam).
  - `reservations.service.ts`: zod doğrulama → insert (`pending`); EXCLUDE constraint ihlali (23P01) "bu saat az önce doldu" mesajına çevrilir.
  - "Rezervasyonlarım" sayfası: geçmiş/gelecek ayrımı, durum rozetleri, iptal (pending/confirmed iken, saatinden önce).
- **Kabul Kriterleri:** Çift rezervasyon DB seviyesinde imkansız; yarış durumunda kullanıcı dostu hata; iptal kuralları çalışır.
- **Dokunulacak Dosyalar:** `src/features/reservations/*`, `src/pages/MyReservations.tsx`.
- **Riskler/Notlar:** Fiyat asla istemciden alınmaz; slot fiyatı servis tarafında `price_rules`'tan yeniden hesaplanır.

### Phase 6 — Tesis Sahibi Paneli

- **Amaç:** Tesis sahibinin tesis/saha/fiyat/rezervasyon yönetimi.
- **Görevler:**
  - Panel layout'u (sidebar/mobil tab) + rol korumalı route (`venue_owner`).
  - Tesis CRUD: çok adımlı form (bilgiler → adres → olanaklar/sporlar → görseller); kaydet → `draft`, "Onaya Gönder" → `pending`.
  - Saha CRUD + çalışma saatleri editörü (7 gün) + fiyat kuralları editörü.
  - Rezervasyon yönetimi: liste (tarih/durum filtresi), onayla/reddet/tamamlandı işaretle.
  - Basit özet kartları: bugünkü rezervasyon, haftalık doluluk.
- **Kabul Kriterleri:** Owner yalnızca kendi tesislerini görür/yönetir; durum akışı draft→pending→approved doğru işler.
- **Dokunulacak Dosyalar:** `src/features/dashboard/*`, `src/pages/dashboard/*`.
- **Riskler/Notlar:** Formlar parçalı kaydedilebilir olmalı; dev tek-form yerine adım adım.

### Phase 7 — Admin Paneli

- **Amaç:** Tesis onay/red ve genel görünürlük.
- **Görevler:**
  - Rol korumalı admin route.
  - Onay kuyruğu: pending tesisler, detay inceleme, onayla/reddet (+ red gerekçesi).
  - Tüm tesisler + tüm rezervasyonlar listesi (filtreli, salt okunur).
- **Kabul Kriterleri:** Admin onayı sonrası tesis publicte görünür; red gerekçesi owner'a gösterilir.
- **Dokunulacak Dosyalar:** `src/features/admin/*`, `src/pages/admin/*`.
- **Riskler/Notlar:** Admin rolü yalnızca DB'den elle atanır (UI'dan admin yapılamaz).

### Phase 8 — Storage, Görseller & Polish

- **Amaç:** Görsel yükleme + genel cila.
- **Görevler:**
  - Storage bucket `venue-images` (public read, owner write policy); yükleme bileşeni (önizleme, sıralama, silme, boyut/tip doğrulama).
  - Landing/kart/detay görsellerinin gerçek verilerle bağlanması; lazy loading.
  - Sayfa geçişleri, hover durumları, toast geri bildirimleri, 404 sayfası, favicon/meta.
- **Kabul Kriterleri:** Görsel yükleme uçtan uca çalışır; Lighthouse mobil makul; kırık görsel/boş durum kalmaz.
- **Dokunulacak Dosyalar:** storage migration, `src/features/dashboard/components/ImageUploader.tsx`, genel.
- **Riskler/Notlar:** Görseller max ~2MB, jpg/png/webp; storage path `venue_id/uuid.ext`.

### Phase 9 — RLS, Doğrulama & Güvenlik

- **Amaç:** Tüm politikaların gözden geçirilip sıkılaştırılması.
- **Görevler:**
  - Her tablo için RLS matrisi (rol × işlem) çıkar ve politikalarla birebir doğrula.
  - Rezervasyon insert'ünde fiyat/slot bütünlüğü: fiyat sunucu tarafı (DB trigger veya kontrollü RPC) doğrulanır.
  - Tüm formlarda zod şemaları eksiksiz; client hataları Türkçe.
  - Rol korumalı route'ların URL ile bypass edilemediği test edilir.
- **Kabul Kriterleri:** Anon/customer/owner/admin ile CRUD matrisi beklendiği gibi; başkasının verisi hiçbir yoldan okunamaz/yazılamaz.
- **Dokunulacak Dosyalar:** RLS migration, `src/features/*/services`, şemalar.
- **Riskler/Notlar:** "Parent tesis approved ise alt tablolar public SELECT" kuralı atlanmasın.

### Phase 10 — Test, Bug Fix & MVP Temizlik

- **Amaç:** Yayınlanabilir MVP.
- **Görevler:**
  - Slot üretimi + fiyat hesabı için birim testleri (vitest).
  - Uçtan uca manuel senaryo turu: kayıt → arama → rezervasyon → owner onayı → iptal → admin onay akışı.
  - Ölü kod/console.log temizliği; typecheck + build + lint sıfır hata.
  - README: kurulum, env, migration uygulama adımları.
- **Kabul Kriterleri:** Tüm ana senaryolar hatasız; build temiz; README ile sıfırdan kurulum mümkün.
- **Dokunulacak Dosyalar:** `src/**/*.test.ts`, README.md, genel.
- **Riskler/Notlar:** MVP'de e2e framework (Playwright) zorunlu değil; manuel tur + birim test yeterli.

### Phase 11 — Gelecek Yol Haritası (MVP sonrası)

- Gerçek ödeme: iyzico/PayTR (kapora + tam ödeme), webhook ile `payments` güncelleme.
- ✅ Yorum & puanlama (reviews aktifleştirme), favoriler. *(2026-07 — merge edildi)*
- ✅ Owner istatistik ekranı (doluluk, ciro raporu, dönem filtresi). *(2026-07 — `owner-stats` PR)*
- ⏸️ Bildirimler: e-posta (rezervasyon onayı/hatırlatma), ileride SMS/push.
  - **Durum (Temmuz 2026): RAFA KALDIRILDI — geliştirmeye sonradan devam edilecek.**
  - Altyapı hazır: `supabase/functions/notify-reservation` (Resend), secret'lar ayarlı,
    fonksiyon deploy edildi, Database Webhook kuruldu (`notify-owner-email` branch/PR).
  - Bekleyen tek engel: Resend test modu yalnızca hesap sahibinin e-postasına gönderir.
    **Alan adı alınıp Resend'de doğrulanınca** `NOTIFY_FROM_EMAIL` güncellenecek ve
    tüm tesis sahiplerine gönderim açılacak (detay: fonksiyonun README'si).
  - Not: Sohbette görünen Resend API anahtarı aktivasyondan önce yenilenmeli.
- Harita görünümü (leaflet) + konuma göre "yakınımdaki tesisler".
- Tekrarlayan rezervasyon (her salı 20:00), kapora iade kuralları.
- Owner istatistik ekranı (doluluk, gelir raporu).
- Çoklu dil (EN), SEO/SSR ihtiyacı doğarsa Next.js değerlendirmesi.
- Mobil uygulama (React Native / Expo).

### Phase 12 — Fikir Havuzu (aday özellikler)

Ürün kararı bekleyen adaylar; her biri kendi branch/PR'ında geliştirilir.
Etiketler: 🟢 küçük (1 oturum) · 🟡 orta (1-2 gün) · 🔴 büyük (çok oturum).

#### Müşteri deneyimi
- 🟢 **Takvime ekle:** rezervasyon onayında ICS dosyası + Google Calendar linki — hızlı kazanım.
- 🟢 **Rezervasyon paylaşımı:** "Maça geliyor musun?" — WhatsApp/kopyalanabilir davet linki.
- 🟡 **Gelişmiş filtreler:** olanaklara göre (duş, otopark...), kapalı/açık saha, seçilen tarih-saatte müsait tesis filtresi.
- 🟡 **Boş saat alarmı (bekleme listesi):** dolu slot iptal olunca ilgilenen müşteriye bildirim.
- 🟡 **Yoruma tesis sahibi yanıtı** + yorum şikayet/moderasyon akışı.
- 🟡 **Son dakika fırsatları:** bugün boş kalan saatlere tesis sahibinin indirim etiketi koyabilmesi.
- 🔴 **Tekrarlayan rezervasyon:** "her Salı 20:00" serisi; çakışma ve istisna (tek hafta iptali) yönetimi.
- 🔴 **Rakip/oyuncu bul:** eksik oyuncu tamamlama, açık maç ilanları, basit takım yönetimi.
- 🔴 **Sadakat & kampanya:** promosyon kodu, X. rezervasyona indirim (ödeme entegrasyonuyla birlikte anlamlı).

#### Tesis sahibi paneli
- 🟡 **Takvim görünümü:** haftalık grid'de tüm sahaların rezervasyonları; boş hücreye tıkla → manuel rezervasyon (telefonla arayan müşteri için).
- 🟢 **Saat bloklama:** bakım/özel etkinlik için slotu rezervasyona kapatma.
- 🟢 **No-show takibi:** "gelmedi" işaretleme; müşteri geçmişinde no-show sayısı.
- 🟢 **Doluluk ısı haritası:** istatistik sayfasına gün × saat ısı haritası.
- 🔴 **Personel hesapları:** tesise bağlı sınırlı yetkili alt kullanıcılar (rezervasyon onaylar, tesisi düzenleyemez).

#### Platform / teknik
- 🟡 **Uygulama içi bildirim merkezi:** header'da zil + okunmamış sayacı (e-posta ⏸️ domain bekliyor; bkz. Phase 11 notu).
- 🟡 **PWA:** ana ekrana ekleme, temel offline, push bildirim altyapısına zemin.
- 🟡 **SEO:** meta/OG etiketleri, sitemap, tesis sayfalarında yapılandırılmış veri (schema.org); SSR gerekirse Next.js değerlendirmesi.
- 🟡 **KVKK araçları:** "hesabımı sil" (verilerle birlikte) ve "verilerimi indir" self-servis akışları.
- 🟡 **Admin genişletme:** platform geneli istatistik, yorum moderasyon kuyruğu, denetim kaydı (audit log).
- 🟢 **E-posta doğrulama & şifre sıfırlama** akışlarının cilalanması (Supabase şablonlarının Türkçeleştirilmesi).
