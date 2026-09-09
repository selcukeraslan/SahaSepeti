# SahaSepeti — Agent Roadmap

> Bu dosya projenin geliştirme yol haritası ve ajanlar için tek çalışma kaynağıdır.
> Codex/Claude göreve başlamadan önce bu dosyayı, `AGENTS.md`yi ve `CLAUDE.md`yi okur.

## 0. Ajan protokolü

### Göreve başlamadan önce

1. `AGENTS.md` ve `CLAUDE.md`yi oku.
2. Bu dosyada `CURRENT` olarak işaretlenen bölümü bul.
3. İlgili fazın kabul kriterlerini ve kanıt dosyalarını incele.
4. Aynı işi daha önce yapan mevcut kod desenini bul; yeni desen icat etme.
5. Belirsizlik, kapsam çakışması veya güvenlik riski varsa kod yazmadan önce bildir.

### Görev sırasında

- Yalnızca mevcut fazın kapsamındaki işi yap.
- Supabase çağrılarını `src/features/*/services/` içinde tut.
- DB şeması değişirse yeni migration yaz; eski migrationı değiştirme.
- `any` kullanma; loading, empty, error, success ve duplicate-submit durumlarını düşün.
- Gizli bilgileri ve `.env` dosyasını commit etme.

### Görev bitince

1. İlgili testleri çalıştır.
2. Mümkünse `npm run typecheck`, `npm run lint`, `npm test` ve `npm run build` çalıştır.
3. Sadece gerçekten doğrulanan görevleri `[x]` yap.
4. `Evidence` alanına dosya, migration, test veya komut ekle.

### Durum sözlüğü

- `✅ Done`: Kod ve kanıt mevcut; tamamlandı.
- `🔍 Verify`: Kod büyük ölçüde mevcut; manuel veya eksik otomatik doğrulama var.
- `CURRENT`: Şu anda yapılacak iş.
- `⏸ Deferred`: Bilinçli olarak sonraya bırakıldı.
- `💡 Candidate`: Fikir havuzu; geliştirme görevi değildir.

## 1. Genel proje bağlamı

SahaSepeti, Türkiye'deki spor tesisi ve saha rezervasyon platformudur.

- Customer tesis arar, müsait slot görür ve rezervasyon yapar.
- Venue owner tesis, saha, çalışma saati, fiyat ve rezervasyon yönetir.
- Admin tesisleri inceler, onaylar/reddeder ve platformu denetler.
- Gerçek ödeme şu anda yoktur; `payments` tablosu placeholderdır.
- UI dili Türkçe; kod ve veritabanı İngilizce.
- Saat dilimi `Europe/Istanbul`.
- Ana güvenlik sınırı RLS'dir; UI route koruması tek başına yeterli değildir.

## 2. Teknoloji ve mimari sözleşme

- Vite + React + TypeScript strict
- React Router, TanStack Query, Supabase Auth/Postgres/Storage/RLS
- React Hook Form + Zod, date-fns (`tr` locale)
- Feature bazlı yapı: `src/features/{auth,venues,reservations,dashboard,admin,...}`
- DB erişimi yalnızca feature service katmanında
- Paylaşılan UI: `src/components/ui/`; route sayfaları ince kompozisyon katmanı
- Gerçek ödeme, sosyal ağ, sohbet ve oyuncu eşleştirme MVP kapsamı dışındadır

## 3. Faz indeksi

| Faz | Başlık | Durum | Kanıt |
|---|---|---|---|
| 0 | Proje iskeleti ve kurulum | ✅ Done | `package.json`, `src/app`, `src/lib`, Vite config |
| 1 | Supabase şeması ve auth | ✅ Done | `supabase/migrations/001-004`, `src/features/auth` |
| 2 | Layout ve design system | ✅ Done | `src/components/ui`, `src/components/layout` |
| 3 | Public sayfalar ve arama | ✅ Done | `src/pages/Landing.tsx`, `VenueList.tsx`, `src/features/venues` |
| 4 | Tesis detay ve uygunluk | ✅ Done | `VenueDetail.tsx`, `availability.service.ts`, slot testleri |
| 5 | Rezervasyon akışı | ✅ Done | `src/features/reservations`, `MyReservations.tsx`, reservation testleri |
| 6 | Venue owner paneli | ✅ Done | `src/pages/dashboard`, `src/features/dashboard` |
| 7 | Admin paneli | ✅ Done | `src/pages/admin`, `src/features/admin` |
| 8 | Storage, görseller ve polish | ✅ Done | `004_storage.sql`, `images.service.ts`, `Seo.tsx` |
| 9 | RLS, doğrulama ve güvenlik | ✅ Done | `008_security_hardening.sql`, `supabase/tests/008_*` |
| 10 | MVP test ve temizlik | 🔍 Verify | Otomatik rapor geçti; manuel tarayıcı turu açık |
| 11 | MVP sonrası temel özellikler | 🔄 Partial | Tamamlanan ve ertelenen listeler aşağıda |
| 13 | Teknik sağlamlaştırma ve regresyon | 🔍 Verify | Kod/refactor mevcut; manuel UI kontrolü açık |
| 14 | Rezervasyon kaynakları | ✅ Done | `009_reservation_sources.sql`, source bileşenleri |
| 15 | Tekrarlayan rezervasyonlar | ✅ Done | `010_reservation_series.sql`, `series.*` |
| 16 | Müşteri rehberi ve hızlı rezervasyon | ✅ Done | `011_venue_customers.sql`, `012_venue_customer_removal.sql` |

### CURRENT — Faz 10/13 doğrulama kapısı

Yeni büyük özellik başlamadan önce bunlar tamamlanmalıdır:

- [ ] Customer kayıt olur, profil trigger'ı ve rolü tarayıcıda doğrulanır.
- [ ] Owner tesis oluşturur, saha/çalışma saati/fiyat ekler ve onaya gönderir.
- [ ] Admin tesisi onaylar; public listede görünür.
- [ ] Customer slot seçer ve rezervasyon oluşturur.
- [ ] Aynı slotta ikinci rezervasyon kullanıcı dostu çakışma mesajı gösterir.
- [ ] Owner rezervasyonu onaylar, tamamlar ve no-show işaretler.
- [ ] Customer uygun rezervasyonu iptal eder.
- [ ] Tamamlanan rezervasyona yorum yazılır ve public maskeli görünür.
- [ ] Customer, owner ve admin route erişimleri gerçek oturumlarla kontrol edilir.
- [ ] Owner başka owner'ın tesis/verisini göremez.
- [ ] 390px mobil ve 1440px masaüstü görünüm kontrol edilir.
- [ ] Browser console ve Network sekmesinde beklenmeyen hata kalmaz.
- [ ] `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` kanıtlanır.

**Tamamlanma kuralı:** Bu maddelerden biri kontrol edilmeden Faz 10/13 `Done` yapılmaz. Ortam sorunu varsa `Blocked` notu ve hata çıktısı eklenir.

## 4. Tamamlanan fazların kanıt özeti

### Faz 0–2 — Temel iskelet ve UI

Vite/React/TypeScript, route yapısı, feature klasörleri ve ortak Button, Input, Dialog, Sheet, Toast, Skeleton, EmptyState ve layout bileşenleri mevcut.

### Faz 3–5 — Customer rezervasyon ürünü

Landing, public tesis listesi, filtreler, tesis detay, müsaitlik slotları, rezervasyon oluşturma/iptal, durum rozetleri ve çift rezervasyon DB constraint'i mevcut.

### Faz 6–7 — Owner ve admin ürünleri

Owner tesis, saha, görsel, çalışma saati, fiyat ve rezervasyon yönetebilir. Takvimden manuel rezervasyon ve bloklama vardır. Admin tesisleri onaylar/reddeder.

### Faz 8–9 — Görsel, RLS ve güvenlik

Storage, SEO/meta/sitemap, RLS, fiyat doğrulaması, rol geçişleri ve no-show zaman kuralları uygulanmıştır.

### Faz 13 — Teknik sağlamlaştırma

Auth ve dashboard servisleri ayrılmış, ekranlar feature bileşenlerine bölünmüş, loading/empty/error/toast/duplicate-submit altyapısı eklenmiştir.

## 5. Faz 11 — MVP sonrası durum

### ✅ Tamamlananlar

- Yorumlar ve puanlama, favoriler, owner istatistikleri.
- Harita ve yakındaki tesisler.
- ICS / Google Calendar bağlantısı.
- Rezervasyon paylaşımı.
- SEO temeli.
- Günlük owner takvimi, saat bloklama ve no-show.

### ⏸ Deferred — bilinçli olarak sonraya bırakılanlar

- Gerçek ödeme: iyzico/PayTR, webhook, iade ve hak ediş akışı.
- E-posta bildirimi: `notify-reservation` hazır; Resend domain doğrulaması bekleniyor.
- Çoklu dil ve gerekirse SSR/Next.js değerlendirmesi.
- Mobil uygulama.

### 💡 Candidate — henüz planlanmamış fikirler

- Gelişmiş filtreler, boş saat alarmı/bekleme listesi.
- Tesis sahibi yorum yanıtı ve moderasyon.
- Son dakika fırsatları, personel hesapları.
- PWA/push bildirimleri.
- KVKK hesap silme/veri indirme.
- Admin istatistikleri/audit log.
- Oyuncu bulma, takım ve sadakat özellikleri.

Candidate maddeler doğrudan geliştirme görevi değildir; önce ürün kararı, kabul kriteri ve ayrı faz tanımı gerekir.

## 6. Faz 14 — Rezervasyon kaynakları ✅

Rezervasyonlar `sahasepeti`, `manual` ve dış sistem kaynağı ayrımını destekler. Owner panelinde kaynak bazlı adet ve tahmini ciro metrikleri vardır.

Evidence: `supabase/migrations/009_reservation_sources.sql`, `ReservationSourceCards.tsx`, `ReservationSourceBadge.tsx`.

## 7. Faz 15 — Tekrarlayan rezervasyonlar ✅

Haftalık rezervasyon serisi oluşturma, önizleme, çakışma kontrolü ve seçilen tarihten sonrasını/tüm seriyi yönetme mevcuttur.

Evidence: `supabase/migrations/010_reservation_series.sql`, `series.service.ts`, `useSeries.ts`, `SeriesManager.tsx`, `SeriesReview.tsx`.

## 8. Faz 16 — Müşteri rehberi ✅

Tesise özel müşteri arama, telefon son dört hane araması, müşteri notları, geçmiş, iptal/no-show sayaçları, hızlı rezervasyonda müşteri seçimi ve mantıksal silme mevcuttur.

Evidence: `supabase/migrations/011_venue_customers.sql`, `supabase/migrations/012_venue_customer_removal.sql`, `customers.service.ts`, `useCustomers.ts`, `CustomerPicker.tsx`.

## 9. Geliştirme görev şablonu

```markdown
## Faz N — Kısa başlık [CURRENT]

### Amaç
Bir cümleyle kullanıcı veya sistem sonucunu yaz.

### Kapsam
- [ ] Küçük, doğrulanabilir görev.

### Kapsam dışı
- Bu fazda yapılmayacak iş.

### Kabul kriterleri
- [ ] Kullanıcı gözlemlenebilir sonucu.
- [ ] Güvenlik/veri sonucu.
- [ ] Test ve doğrulama sonucu.

### Evidence
- Henüz yok.
```

## 10. Son çalışma kaydı

- Son roadmap düzenlemesi: 2026-09-08
- Sonraki iş: CURRENT bölümündeki Faz 10/13 manuel doğrulama kapısı
- Bu roadmap public repoda tutulur; kişisel notlar için ayrı vault kullanılmaz.

### 2026-09-09 manuel doğrulama notu

- Demo customer, venue owner ve admin oturumlarıyla giriş ve rol bazlı ana ekranlar tarayıcıda doğrulandı.
- Customer ve venue owner hesaplarının `/admin` erişimi ana sayfaya yönlendiriliyor; admin hesabı `/admin` onay kuyruğunu açabiliyor.
- Venue owner `/panel` ekranını açabiliyor.
- 390px mobil görünümde ana sayfada yatay taşma gözlenmedi (`scrollWidth` viewport genişliğini aşmadı).
- Console'da uygulama hatası yok; geliştirme ortamında React Router `HydrateFallback` uyarısı mevcut. Network ve kalan uçtan uca rezervasyon adımları henüz tamamlanmadı.
- Customer → slot seçimi → rezervasyon talebi → owner onayı → customer tarafında `Onaylandı` durumu uçtan uca tarayıcıda doğrulandı. Test kaydı canlı Supabase'de `Moda Arena (Demo)`, 9 Eyl 2026 13:00–14:00 olarak kaldı; temizleme için ayrıca onay gerekiyor.
- Auth ekranları tarayıcıda doğrulandı: geçersiz e-posta ve eşleşmeyen şifre reddediliyor. Demo müşteri adresine doğrulama e-postası isteği başarılı döndü. Şifre sıfırlama testi Supabase `429 over_email_send_rate_limit` ile sınırlandı; uygulama bu durumu artık kullanıcı dostu Türkçe mesajla gösteriyor. Redirect URL ve özel SMTP ayarları canlı öncesi tamamlanmalı.

### Sonraki yüksek öncelikli işler

- [x] P1 — Rezervasyon fiyat teklifini sunucu tarafında doğrula; fiyat değişmişse güncel tutarı döndürüp yeniden onay iste. (`016_reservation_price_quote.sql`, canlı migration, typecheck/lint/test/build)
- [x] P2 — Askıya alınmış/taslak tesis yorumlarının public RPC'den görünmesini engelle. (`017_public_reviews_visibility.sql`, canlı migration, typecheck/lint/test)
- [x] P1 — Şifre sıfırlama, e-posta doğrulama dönüşü ve doğrulama e-postasını yeniden gönderme akışını ekle. (Kod ve kalite kontrolleri tamamlandı; Supabase e-posta/redirect ayarları canlıda ayrıca doğrulanmalı.)
- [CURRENT] P1 — Bildirim Edge Function'ını etkinleştirmeden önce zorunlu secret, payload doğrulaması, rezervasyon eşleşmesi ve idempotency ekle.
- [ ] P2 — Owner/admin rezervasyon listelerine sayfalama ve doğru toplam kayıt bilgisini ekle.
- [ ] P2 — Çakışan fiyat kurallarını engelle ve aktif saha fiyatı hesaplamasını netleştir.
- [ ] P2 — Çok adımlı tesis kayıtlarını transaction/RPC ile atomik hale getir.
- [ ] P2 — Sıfır satır etkileyen update/delete işlemlerini başarı sayma.
- [ ] P2 — Dialog ve Sheet bileşenlerinde focus trap ve eski odağa dönüşü tamamla.
- [ ] Yayın öncesi — Demo hesaplarının üretimde olmadığını ve admin MFA durumunu doğrula.

### 2026-09-09 birleştirme özeti

1. **Güvenlik ve veri bütünlüğü:** Saha tesis bağlantısı değişmez hale getirildi, rezervasyon geçmişi olan tesisin silinmesi engellendi, tesis durum geçişleri sıkılaştırıldı ve yorumların rezervasyon/müşteri/tesis bağlantıları korundu. `013_security_integrity.sql`, `015_review_fk_cleanup.sql`
2. **Rezervasyon sınırları:** Müşteri başına en fazla üç bekleyen rezervasyon ve en fazla 30 gün ileri rezervasyon kuralı, paralel istekleri de kapsayacak şekilde veritabanında uygulandı. `014_reservation_limits.sql`
3. **Owner takvimi:** Pasif sahalar listeden çıkarılmıyor; kapalı gün veya çalışma saati dışındaki mevcut rezervasyonlar görünür kalıyor. Takvim ve rezervasyon sorgularında otomatik yenileme/odak dönüşü güncellendi.
4. **Fiyat tutarlılığı:** Rezervasyon özeti açıldıktan sonra fiyat değişirse sunucu işlemi geri alıyor ve kullanıcıdan güncel fiyatı tekrar onaylamasını istiyor. `016_reservation_price_quote.sql`
5. **Public yorum görünürlüğü:** Taslak, reddedilmiş veya askıya alınmış tesis yorumları public RPC’den gizlendi; owner/admin yetkili incelemesi korundu. `017_public_reviews_visibility.sql`
6. **Auth hesap kurtarma:** Şifre sıfırlama, yeni şifre belirleme ve doğrulama e-postasını yeniden gönderme sayfaları/servisleri eklendi. Redirect URL, e-posta rate limit ve kullanıcı dostu hata akışları ele alındı.
7. **Manuel doğrulama:** Customer → rezervasyon → owner onayı → customer tarafında onay durumu uçtan uca test edildi; customer/owner/admin route sınırları ve 390px mobil yatay taşma kontrol edildi.
8. **Kalite kapısı:** Typecheck, lint, 85 frontend testi ve production build başarılı. Canlı Supabase migration zinciri 001–017 ile hizalı; 016 ve 017 canlıya uygulandı.
