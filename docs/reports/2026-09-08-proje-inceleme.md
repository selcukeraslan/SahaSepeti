# SahaSepeti — Teknik, güvenlik ve canlıya çıkış değerlendirmesi

**Tarih:** 8 Eylül 2026  
**İncelenen commit:** `aedcd43` — `restore full project roadmap`  
**Kapsam:** Uygulama kaynakları, 12 migration, RLS/trigger/RPC kuralları, servisler, testler, dağıtım dosyaları ve ürün yol haritası.  
**İlk düzeltme paketi (9 Eylül 2026):** `013_security_integrity.sql` ve karşılık gelen davranış testi eklendi. Uygulama kodu ve mevcut migration’lar değiştirilmedi; canlı veriye yazılmadı.

## 1. Kararım

**Mevcut haliyle herkese açık, gerçek müşteri alan bir lansmanı önermiyorum.** Uygulama derleniyor ve önemli güvenlik temelleri doğru kurulmuş. Ancak rezervasyon geçmişinin silinmesine, takvimin gereksiz rezervasyonlarla kapatılmasına ve yorumların manipüle edilmesine izin veren doğrulanmış iş kuralı açıkları var. Günlük işletme kullanımında takvimin güncelliğini ve raporların doğruluğunu etkileyen sorunlar da bulunuyor.

Projeyi baştan yazmak gerekmiyor. React + Supabase mimarisi bu MVP için yeterli bir temel. Öncelik yeni büyük özelliklerden önce veri bütünlüğü, rezervasyon yaşam döngüsü ve gerçek ortam doğrulaması olmalı.

| Yayın biçimi | Değerlendirme |
|---|---|
| Sentetik verili demo / test ortamı | Kullanılabilir. Demo hesapları yalnızca bu ortamda kalmalı. |
| Seçilmiş tesislerle gerçek rezervasyon pilotu | Aşağıdaki P1 sorunları ve temel operasyon kapısı kapandıktan sonra öneririm. |
| Herkese açık pazar yeri lansmanı | Şimdilik uygun değil. Güvenlik, bildirim, hesap kurtarma ve canlı ortam kanıtları eksik. |
| Tam ödemeli rezervasyon ürünü | Mevcut ürün bu değil. Ödeme kapsam dışı; pilot açıkça “tesis onaylı, ödeme tesiste” olarak sunulmalı. |

**“Saldırıya açık mı?”** Evet, belirli yetkili kullanıcı işlemleri kötüye kullanılabiliyor. Bu, herkesin bütün veritabanını okuyabildiği anlamına gelmiyor. Test ettiğim başka owner’ın rezervasyonlarını okuma, kendi rolünü admin yapma, istemciden fiyat düşürme ve aynı saate ikinci rezervasyon oluşturma girişimleri engellendi.

## 2. Ne gerçekten doğrulandı?

| Kontrol | Sonuç | Sınırı |
|---|---|---|
| `npm run typecheck` | Başarılı | Canlı şema ile tip uyumunu tek başına kanıtlamaz. |
| `npm run lint` | Başarılı | Komut `oxlint` çalıştırıyor. |
| `npm test -- --run` | 15 dosya, 85 test başarılı | Tarayıcı ve canlı RLS testi değildir. |
| `npm run build` | Başarılı | Sitemap için aşağıdaki uyarılar oluştu. |
| Güncel `npm audit --json` | Bilinen açık: 0 | İlk ağ denemesi başarısızdı; ağ erişimiyle tekrar başarılı oldu. Uygulama mantığı ve Deno importları bu sonuç kapsamında değil. |
| `npm run test:db` | Çalıştırılamadı | Yerel Supabase veritabanına bağlantı kurulamadı. “Geçti” sayılmadı. |
| Migration 001–012 | Geçici PostgreSQL 16.14 üzerinde uygulandı | Auth/Storage için minimal test karşılıkları kullanıldı; tam Supabase ortamı değildir. |
| Ek davranış testleri | Aşağıdaki açıklar ve korumalar doğrulandı | Sentetik verilerle, `anon` / `authenticated` rollerinde; test sonunda `ROLLBACK`. |

Geçici ortam, uygulamanın kullandığı Supabase tablo erişim modelini canlandırmak için tablo yetkilerini tanımladı. Auth kullanıcısı ve tamamlanmış rezervasyon test verisi güvenilir kurulum adımında oluşturuldu; saldırı adımları admin olarak çalıştırılmadı. Hosted ortamda migration/GRANT farkı varsa sonuçlar orada ayrıca doğrulanmalı. [Supabase’in GRANT ve RLS açıklaması](https://supabase.com/docs/guides/api/securing-your-api), bu iki katmanın birlikte değerlendirilmesi gerektiğini doğruluyor.

**Bu incelemede yapılmayanlar:** Gerçek oturumlarla 390px/1440px tarayıcı turu, tam Supabase pgTAP paketi, iki eşzamanlı HTTP isteğiyle yarış testi, yük testi, canlı Supabase ayarları/migration farkı, gerçek HTTP güvenlik başlıkları, yedekten geri dönüş, e-posta teslimatı ve canlı demo hesap kontrolü. Rapor bir sızma testi sertifikası veya “açık yok” garantisi değildir.

Build sırasında `VITE_SITE_URL` eksikliği nedeniyle varsayılan Vercel adresi kullanıldı; Supabase fetch başarısız olduğu için sitemap yalnızca 4 statik URL içerdi. Ağ kısıtının etkisi olabileceğinden bunu canlı sitenin bozuk olduğunun kanıtı saymıyorum. Üretim build’inde kontrol edilmeli.

Deneylerin kurulum SQL’i, senaryoları ve çıktıları: [Denetim kanıtı](/Users/selcuk/Desktop/SahaSepetiV2/docs/reports/2026-09-08-audit-evidence.txt).

## 2a. İlk düzeltme paketi

İlk adımda G1’in saha/tesis veri kaybı yolu kapatıldı: saha tesis bağlantısı değişmez hale getirildi, approved tesisin owner tarafından draft’a çekilmesi engellendi ve rezervasyon geçmişi olan tesis fiziksel olarak silinemiyor. G3 için yorumun müşteri/tesis/rezervasyon bağlantıları UPDATE’te değişmez hale getirildi ve yorum varsa tamamlanmış rezervasyonla eşleşmesi zorunlu kılındı. G6 için rezervasyon notuna 500 karakterlik veritabanı sınırı eklendi.

Yeni migration: [013_security_integrity.sql](/Users/selcuk/Desktop/SahaSepetiV2/supabase/migrations/013_security_integrity.sql)  
Yeni test: [013_security_integrity.test.sql](/Users/selcuk/Desktop/SahaSepetiV2/supabase/tests/013_security_integrity.test.sql)

Migration zinciri 001–013 geçici PostgreSQL 16.14 ortamında başarıyla uygulandı. Sonraki 014 limiti de aynı ortamda uygulandı. 9 Eylül 2026’da bağlı canlı Supabase projesinde 009–012 nesnelerinin zaten mevcut olduğu REST ile doğrulandı; eksik migration geçmişi senkronlandı ve 013–015 canlıya başarıyla push edildi. Canlı migration listesi 001–015 hizalıdır. Typecheck, lint ve 85 frontend testi de başarılı. İlk yazmalı smoke akışında tüm işlevsel senaryolar geçti; yeni silme koruması test temizliğini engellediği için 015 ile FK cascade temizliği düzeltildi, kalan sentetik tesis yönetim SQL’iyle kaldırıldı ve REST sorgusunda test tesisi kalmadığı doğrulandı. pgTAP paketi yerel ortamda bulunmadığı için 013/014 test dosyaları henüz Supabase CLI üzerinde çalıştırılmış sayılmıyor; `npm run test:db` gerçek yerel Supabase bağlantısı bekliyor.

Canlı demo müşteriyle 3 bekleyen rezervasyon oluşturma başarılı oldu; 4. kayıt `Aynı anda en fazla 3 bekleyen rezervasyonunuz olabilir`, 31 gün sonrası `Rezervasyonlar en fazla 30 gün öncesinden yapılabilir` hatasıyla reddedildi. Üç geçici kayıt müşteri üzerinden iptal edildi.

## 3. Doğru yaptığımız işler

- Feature → servis → hook → bileşen ayrımı büyük ölçüde uygulanmış. İncelenen UI bileşenlerinde doğrudan `supabase.from(...)` kullanımına rastlamadım.
- Public uygulama tablolarında RLS migration’ları mevcut. Kayıtta kullanıcı metadata’sından `admin` rolü kabul edilmiyor; sonradan rol yükseltme de trigger ile engelleniyor.
- Fiyat ve tesis kimliği rezervasyon insert’inde sunucuda hesaplanıyor. Testte gönderilen `1` tutarı, kuraldaki `1000` tutarına çevrildi.
- Çift rezervasyon, yalnızca buton kapatılarak değil PostgreSQL EXCLUDE constraint’iyle engelleniyor. Aynı aralık tekrarında `23P01` alındı.
- Geçmiş saat, çalışma saati, bir saatlik slot ve owner durum geçişi kontrolleri veritabanında mevcut.
- Ham yorum satırları herkese açılmamış; public yorumlarda ad maskeleniyor. JSON-LD metni HTML kapanışına karşı kaçışlanıyor.
- Auth değişiminde kullanıcıya özel query cache’i temizleniyor; eski profil isteklerinin yeni oturumu ezmesine karşı sıra kontrolü var.
- Seri rezervasyonda önizleme ve kaydetme aynı trigger zincirini kullanıyor; işlem başarısızlığı/önizleme geri alma mantığı düşünülmüş.
- Storage’da 2 MB dosya sınırı ve JPEG/PNG/WebP izin listesi mevcut. `.env` Git tarafından izlenmiyor; yerel frontend anahtarı `publishable` tipinde. Bu anahtarın tarayıcıda bulunması tek başına açık değildir. [Supabase API anahtarları](https://supabase.com/docs/guides/getting-started/api-keys).

Bunları koruyarak ilerlemek, yeni bir framework veya backend’e geçmekten daha anlamlı.

## 4. Öncelikli bulgular

Öncelikler bu projeye ait iş sırasıdır; CVSS puanı değildir. **P1:** gerçek kullanıcıdan önce düzelt. **P2:** pilot içinde veya büyümeden önce düzelt. **P3:** sonraki iyileştirme. Canlı ortamda varlığı doğrulanmamış kritik koşullar ayrıca belirtilmiştir.

### G1 — P1: Owner müşteri rezervasyon geçmişini dolaylı olarak silebiliyor

**Durum: Geçici PostgreSQL üzerinde doğrulandı.**

Üç kural birleşiyor:

1. Owner, bir sahanın `venue_id` değerini kendi başka tesisine değiştirebiliyor.
2. Eski tesis `approved` durumundan `draft` durumuna alınabiliyor; kontrol yalnızca hedef durumun `draft/pending` olmasına bakıyor.
3. Taslak tesis owner tarafından silinebiliyor. `reservations.venue_id` bağlantısı `ON DELETE CASCADE` olduğu için müşteri kayıtları da siliniyor.

Testte saha başka tesise taşındı, eski tesis taslağa çevrildi ve silindi. Eski tesisteki marketplace rezervasyonları kayboldu. Böylece “gerçek müşteri rezervasyonları silinmez, iptal edilir” kuralı doğrudan rezervasyon DELETE izni olmadan aşılmış oldu. Yetki, saldırganın sahip olduğu tesislerle sınırlı; başka owner’ın tesisini silebildiğini göstermiyor.

**Ayrı etkisi:** Tesis silinmese bile saha taşındıktan sonra `reservations.venue_id` ile `courts.venue_id` uyuşmuyor. Takvim, seri ve müşteri rehberi yanlış tesise bağlanmış verilerle çalışabiliyor.

**Düzeltme:** Kullanılmış sahanın tesis bağlantısını değişmez yap; tesis durum geçişlerini eski ve yeni duruma göre tanımla; rezervasyon geçmişi olan tesise fiziksel silme yerine arşivleme uygula. İlişkisel tutarlılığı mümkünse constraint ile garanti et. Sadece UI’da silme/taşıma düğmesini gizlemek yeterli değil.

**Kabul testi:** Kayıtlı owner aynı SQL/API işlem zincirini deneyince reddedilmeli; geçmiş rezervasyon, yorum ve seri ilişkileri korunmalı.

**Kanıt:** [Saha RLS’i](/Users/selcuk/Desktop/SahaSepetiV2/supabase/migrations/003_rls.sql:123), [tesis silme politikası](/Users/selcuk/Desktop/SahaSepetiV2/supabase/migrations/003_rls.sql:56), [durum trigger’ı](/Users/selcuk/Desktop/SahaSepetiV2/supabase/migrations/002_functions_triggers.sql:120), [cascade bağlantısı](/Users/selcuk/Desktop/SahaSepetiV2/supabase/migrations/001_schema.sql:126).

### G2 — P1: Tek hesapla takvim envanteri kapatılabiliyor

**Durum: Kota/tarih sınırı eksikliği PostgreSQL üzerinde doğrulandı.**

Bir customer hesabıyla tek işlemde 100 farklı güne `pending` rezervasyon ekledim. Ayrıca 2099 yılına rezervasyon kabul edildi. Bekleyen rezervasyonlar da EXCLUDE ve doluluk sorgusuna girdiğinden slotu kapatıyor. Şemada son kullanma zamanı, bekleyen kayıt kotası veya geleceğe rezervasyon sınırı yok; repoda bunları uygulayan zamanlanmış iş de bulunmuyor.

Bu bir fiyat veya RLS atlatması gerektirmiyor: Kullanıcının izinli işlemi aşırı kullanması yeterli. Owner iptal etmedikçe ilgili saatler başka müşterilere satılamaz. Canlıda ek ağ koruması bulunup bulunmadığı incelenmedi; veritabanı katmanında iş kotası olmadığı doğrulandı.

**Düzeltme:** Kullanıcı başına eşzamanlı bekleyen talep sınırı, tesisin rezervasyon ufku, owner cevap süresi ve süresi dolan taleplerin atomik iptali. API’ye kullanıcı/IP oran sınırlaması ekle; paralel isteklerle kota aşılmamasını test et. Süre ve kota değerleri ürün kararı olarak seçilmeli. Auth endpoint korumasını rezervasyon kotasının yerine koyma. [Supabase API istek kontrolleri](https://supabase.com/docs/guides/api/securing-your-api).

**Kabul testi:** Kota aşımında anlamlı hata; süresi dolan talepte slotun açılması; owner onayıyla zaman aşımı aynı anda çalıştığında tek tutarlı sonuç.

**Kanıt:** [Insert doğrulaması](/Users/selcuk/Desktop/SahaSepetiV2/supabase/migrations/008_security_hardening.sql:71), [pending başlangıcı](/Users/selcuk/Desktop/SahaSepetiV2/supabase/migrations/008_security_hardening.sql:151), [doluluk constraint’i](/Users/selcuk/Desktop/SahaSepetiV2/supabase/migrations/001_schema.sql:141).

### G3 — P1: Yorum, hiç ziyaret edilmeyen tesise taşınabiliyor

**Durum: PostgreSQL üzerinde doğrulandı.**

INSERT politikası tamamlanmış rezervasyon arıyor. UPDATE politikası yalnızca `customer_id = auth.uid()` kontrolü yapıyor. Kendi yorumunun `venue_id` alanını başka tesise değiştiren müşteri, hedef tesiste hiç tamamlanmış rezervasyonu olmasa da puan ve yorum yayınlayabiliyor. İlk tesise yeniden yorum oluşturup taşıyarak birden fazla tesisi etkileme yolu da açılıyor.

`reservation_id` ilişkisinin ilgili kullanıcıya, tesise ve tamamlanmış rezervasyona aitliği de doğrudan doğrulanmıyor.

**Düzeltme:** Yorum kimlik bağlantılarını değişmez yap; INSERT ve UPDATE için aynı hak kontrolünü uygula. Yorumun dayandığı rezervasyonun müşteri/tesis/durum eşleşmesini doğrula. Güncellenebilir alanları puan ve yorum metniyle sınırla.

**Kabul testi:** Ziyaret edilmiş tesiste yorum düzenlenebilir; farklı tesise veya başka rezervasyona taşınamaz.

**Kanıt:** [Yorum INSERT/UPDATE politikaları](/Users/selcuk/Desktop/SahaSepetiV2/supabase/migrations/003_rls.sql:258).

### G4 — P1, etkinleştirme öncesi: Bildirim endpoint’inin güven sınırı yetersiz

**Durum: Koddan doğrulanan koşullu risk; deploy ve secret ayarları görülmedi. Bildirim çağrılmadı, e-posta gönderilmedi.**

`NOTIFY_WEBHOOK_SECRET` isteğe bağlı. Tanımlı değilse handler çağıranın gerçekten database webhook’u olduğunu kontrol etmiyor. Gövde JSON olarak okunuyor ama çalışma zamanında şemayla doğrulanmıyor; `type/table` alanları ve rezervasyonun gerçekten varlığı denetlenmiyor. Gövdedeki tesis kimliği üzerinden service role ile owner e-postası bulunup gönderim yapılıyor.

Endpoint genel kullanıcı çağrılarına açıksa ve secret yoksa, erişebilen kişi gerçek rezervasyon oluşturmadan tesis sahibine sahte bildirimler göndertip maliyet/spam yaratabilir. JWT’nin geçerli olması, çağıranın webhook olduğunu tek başına kanıtlamaz. [Supabase Edge Function kimlik doğrulaması](https://supabase.com/docs/guides/functions/auth).

**Düzeltme:** Makine çağrısı için zorunlu kimlik doğrulaması; eksik secret’ta kapalı davranış; POST ve payload şeması kontrolü; rezervasyonu kimliğiyle DB’den yeniden okuma; olay türü/durum/tesis eşleşmesi; aynı olayın iki kez gönderilmesini engelleyen kayıt. Hata loglarında sağlayıcının ham cevabı yerine temizlenmiş hata kodu kullan.

Fonksiyon şu an yalnızca owner’a yeni talep bildiriyor; müşteriye onay/iptal ve hatırlatma yok. `TODO.md` e-posta yayınını domain doğrulaması nedeniyle erteliyor. Canlıda aktif değilse bugünkü istismar yüzeyi değil; **mevcut kodu olduğu gibi etkinleştirmek uygun değil.**

**Kanıt:** [Secret ve handler](/Users/selcuk/Desktop/SahaSepetiV2/supabase/functions/notify-reservation/index.ts:110), [gövdeye dayalı lookup](/Users/selcuk/Desktop/SahaSepetiV2/supabase/functions/notify-reservation/index.ts:136), [gönderim](/Users/selcuk/Desktop/SahaSepetiV2/supabase/functions/notify-reservation/index.ts:174).

### G5 — P2: Gizli/askıya alınmış tesisin yorumları public RPC’den okunuyor

**Durum: PostgreSQL üzerinde doğrulandı.**

`get_venue_reviews`, `SECURITY DEFINER` çalışıyor ve tesis durumunu denetlemiyor. Tesis askıya alındıktan sonra anonim rolde yorum okunabildi. Maskeli isim dışında profil telefonu/e-postası dönmedi; bulgu bu verilerin sızması değildir. Problem, public tesis görünürlüğüyle yorum görünürlüğünün ayrışmasıdır.

**Düzeltme:** Rating summary RPC’sindeki gibi onaylı tesis / owner / admin görünürlük kuralı uygula; taslak, rejected, suspended için negatif test ekle.

**Kanıt:** [Public yorum fonksiyonu](/Users/selcuk/Desktop/SahaSepetiV2/supabase/migrations/006_reviews_public_read.sql:18).

### G6 — P2: Frontend doğrulaması bazı alanlarda tek sınır olarak kalmış

**Durum: 10.000 karakterlik rezervasyon notunun DB’ye kabulü doğrulandı.**

Form 500 karakterle sınırlı; API’den doğrudan yazmada bu sınır yok. İlk şemadaki tesis açıklaması, ad, bazı notlar ve koordinatlar için de frontend’deki bütün sınırlar DB’de bulunmuyor. Yeni müşteri rehberi/seri tabloları bu konuda daha iyi korunmuş.

**Düzeltme:** Ürün için gerekli uzunluk, koordinat ve tarih sınırlarını yeni migration’da uygula; mevcut veriyi önce ölç. Storage’da dosya başına sınırın yanına tesis/hesap başına toplam kota ve sahipsiz dosya temizliği ekle. Yalnızca TypeScript/Zod kodunun tarayıcıda çalışması, doğrudan API isteğini sınırlamaz.

**Kanıt:** [Rezervasyon alanları](/Users/selcuk/Desktop/SahaSepetiV2/supabase/migrations/001_schema.sql:128), [form şemaları](/Users/selcuk/Desktop/SahaSepetiV2/src/features/dashboard/schemas.ts:1), [Storage kuralları](/Users/selcuk/Desktop/SahaSepetiV2/supabase/migrations/004_storage.sql:5).

### G7 — Koşullu kritik yayın kontrolü: Bilinen şifreli demo admin hesabı

Seed dosyası bilinen sabit şifreyle demo admin oluşturuyor; smoke script de bu hesaba dayanıyor. Geliştirme verisi olması tek başına açık değil. **Bu hesap üretimde varsa admin hesabının ele geçirilmesi kritik risktir. Üretimde bulunduğu doğrulanmadı.**

Lansmandan önce üretimde demo hesaplarının bulunmadığı, örnek verinin üretime uygulanmadığı ve admin erişiminin MFA ile korunduğu kanıtlanmalı. Seed’leri geliştirme ortamıyla sınırlamak ve smoke testleri ayrı test projesine bağlamak gerekir.

**Kanıt:** [Demo seed](/Users/selcuk/Desktop/SahaSepetiV2/supabase/seed.sql:17), [smoke script](/Users/selcuk/Desktop/SahaSepetiV2/scripts/phase13-smoke.mjs:12).

## 5. Günlük kullanımda düzeltilmesi gerekenler

| Öncelik | Problem ve etkisi | Önerilen sonuç / kanıt |
|---|---|---|
| P1 | **Owner takvimi ve müşteri rezervasyon durumu kendiliğinden güncel kalmıyor.** Owner sorgularında polling/realtime yok; global `refetchOnWindowFocus: false`. Başka cihazdan yeni rezervasyon veya iptal açık sayfada uzun süre görünmeyebilir. Stale süresi zamanlayıcı değildir. | Önce görünür sayfada düzenli yenileme, odak/ağ dönüşünde yenileme ve son güncelleme bilgisi; gerekirse sonra Realtime. [Owner hook](/Users/selcuk/Desktop/SahaSepetiV2/src/features/dashboard/hooks/useDashboard.ts:192), [query ayarı](/Users/selcuk/Desktop/SahaSepetiV2/src/lib/queryClient.ts:3). |
| P1 | **Mevcut rezervasyon takvimden görünmez hale gelebiliyor.** Takvim yalnızca aktif sahaları ve bugünkü çalışma saatlerinden üretilen slotları çiziyor. Sahayı pasife alma, günü kapatma veya saatleri daraltma mevcut kaydı DB’den silmese de takvimde saklayabilir. | Gerçek rezervasyonlar slot üretiminden bağımsız çizilmeli; kapalı saatlerdeki mevcut kayıtlara uyarı verilmeli. Değişiklik öncesi etkilenen rezervasyonlar gösterilmeli. [Takvim servisi](/Users/selcuk/Desktop/SahaSepetiV2/src/features/dashboard/services/calendar.service.ts:49). |
| P1 | **Gösterilen fiyat ile kaydedilen fiyat değişebilir.** Kullanıcı özeti açıkken owner fiyatı değiştirirse DB yeni fiyatı hesaplar; dialog dönen tutarı yeniden onaylatmadan başarı gösterir. Aynı algoritma kullanmak iki ayrı andaki veriyi eşitlemez. | Sunucunun ürettiği fiyat sürümü/teklif üzerinden kontrol; fiyat değiştiyse kullanıcıya yeni tutarı gösterip tekrar onaylat. Fiyat yine sunucuda hesaplanmalı. [Dialog](/Users/selcuk/Desktop/SahaSepetiV2/src/features/reservations/components/ReservationDialog.tsx:39), [DB fiyatı](/Users/selcuk/Desktop/SahaSepetiV2/supabase/migrations/008_security_hardening.sql:164). |
| P1 | **Şifre sıfırlama ve doğrulama e-postasını yeniden gönderme akışı yok.** Gerçek kullanıcı hesap erişimini kaybedince self-servis dönüş yolu bulunmuyor. | Hesap kurtarma, güvenli redirect, e-posta doğrulama dönüşü ve tekrar gönderim. Admin için MFA. [Auth servisi](/Users/selcuk/Desktop/SahaSepetiV2/src/features/auth/services/auth.service.ts:16), [route’lar](/Users/selcuk/Desktop/SahaSepetiV2/src/app/router.tsx:5). |
| P2 | **Rezervasyon listeleri sessizce kesiliyor.** Owner/admin listesi 200 kayıtla sınırlı; devam sayfası yok. Gelecek haftalık seriler listeyi doldurup bugünkü kayıtları dışarı itebilir. İstatistik servisi son 2000 kaydı alıyor; “Tümü” tüm veri değil. | DB’de dönem filtresi ve toplu hesap, listelerde sayfalama/toplam kayıt. Sayısal eksikliği kullanıcıdan gizlememe. [Owner sorguları](/Users/selcuk/Desktop/SahaSepetiV2/src/features/dashboard/services/ownerReservations.service.ts:29), [admin sorgusu](/Users/selcuk/Desktop/SahaSepetiV2/src/features/admin/services/admin.service.ts:63). |
| P2 | **Owner müşteri gibi rezervasyon yapabiliyor ama müşteri sayfasına giremiyor.** Dialog yalnızca `user` kontrol ediyor; `/rezervasyonlarim` yalnızca customer’a açık. Owner’ın başka tesisteki kendi rezervasyonu, tesis filtresi olmayan owner sorgularına da RLS üzerinden girebilir. | Hesapların çoklu rol davranışını açıkça belirle; booking izni ve route’ları eşitle; owner listelerini gerçekten sahip olunan tesislerle filtrele. [Dialog](/Users/selcuk/Desktop/SahaSepetiV2/src/features/reservations/components/ReservationDialog.tsx:32), [guard](/Users/selcuk/Desktop/SahaSepetiV2/src/app/guards.tsx:20). |
| P2 | **Aynı düzeyde çakışan fiyat kuralları kabul ediliyor.** Aynı saat için 1000 ve 1500 eklenirse sıralama düşük fiyatı seçebilir; yeni kural eskiyi değiştirmiyor. Kart minimum fiyatı pasif sahalardan da hesaplanabiliyor. | Çakışma uyarısı/önleme, açık kural önceliği, atomik fiyat düzenleme ve aktif saha fiyatı. [Fiyat seçimi](/Users/selcuk/Desktop/SahaSepetiV2/src/features/venues/services/slots.ts:47), [liste fiyatı](/Users/selcuk/Desktop/SahaSepetiV2/src/features/venues/services/venues.service.ts:24). |
| P2 | **Bazı çok adımlı kayıtlar kısmi kalabilir.** Tesis yazımı başarılı, spor eşitlemesi başarısızsa form hata gösterir ama tesis oluşmuştur; tekrar denemede ikinci tesis oluşabilir. Görsel silmede bazı takip hataları yutuluyor. | Tesis + spor değişimini yetkili transaction/RPC ile yap; dosya temizliği hatalarını takip et. [Tesis servisi](/Users/selcuk/Desktop/SahaSepetiV2/src/features/dashboard/services/ownerVenues.service.ts:62), [görsel servisi](/Users/selcuk/Desktop/SahaSepetiV2/src/features/dashboard/services/images.service.ts:63). |
| P2 | **Sıfır satır etkileyen mutasyon başarı gibi dönebiliyor.** Birçok update/delete yalnızca `error` kontrol ediyor. Yanlış/silinmiş ID veya yetki değişiminde RLS sıfır satır döndürebilir. | Etkilenen kaydı doğrula; rezervasyon iptal servisindeki mevcut deseni kullan. [Owner durum güncellemesi](/Users/selcuk/Desktop/SahaSepetiV2/src/features/dashboard/services/ownerReservations.service.ts:82). |
| P2 | **Modal klavye yönetimi eksik.** `Dialog`/`Sheet` Escape’i ele alıyor; odak aktarma, modal içinde tutma ve eski odağı geri verme yok. | Klavyeyle rezervasyon, iptal ve mobil menü akışını tamamla. [Dialog](/Users/selcuk/Desktop/SahaSepetiV2/src/components/ui/Dialog.tsx:15), [Sheet](/Users/selcuk/Desktop/SahaSepetiV2/src/components/ui/Sheet.tsx:17). |
| P2 | **Destek bilgilerinde placeholder var.** İletişim telefonu örnek numara; form yalnızca mail uygulamasını açıyor. E-posta adresinin çalıştığı doğrulanmadı. | Gerçek ve takip edilen destek kanalı, talep alındı durumu. [İletişim](/Users/selcuk/Desktop/SahaSepetiV2/src/pages/Contact.tsx:11). |

Owner takvimindeki tazelik sorunu DB’nin çift rezervasyon korumasını kaldırmıyor. Fakat owner telefonda müşteriye yanlış müsaitlik söyleyebilir. Bu ürünün ana değeri takvim doğruluğu olduğu için iş önceliği yüksek.

## 6. Mimari ve geliştirme sürecinde yanlış gidenler

**Özellik sayısı, doğrulama hızını geçmiş.** Yol haritasında Faz 10/13 manuel kapısı hâlâ açıkken seri rezervasyon ve müşteri rehberi tamamlanmış. Bunlar yararlı özellikler; ancak temel akışların gerçek oturumlarla çalıştığının kanıtı olmadan kapsam büyümüş. `TODO.md` içindeki mevcut doğrulama kapısını korumalıyız.

**RLS “hangi satır senin?” sorusunu yanıtlıyor; bütün iş kurallarını yanıtlamıyor.** Yorum taşıma ve saha taşıma bunun örnekleri. Kritik tablolarda değişmez kimlikler, izinli kolonlar ve eski/yeni durum geçişleri ayrı sözleşme olmalı. PostgreSQL’in politika açıklaması da eski satır ile yeni satır kontrollerini ayırır. [PostgreSQL Row Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).

**Testlerin bir kısmı davranış yerine metin varlığını test ediyor.** Özellikle `008_security_hardening.test.sql`, fonksiyon gövdesinde bazı mesajların bulunduğunu kontrol ediyor. Bu, kurala gerçekten ulaşıldığını veya tüm yolların kapalı olduğunu kanıtlamıyor. Daha yeni seri/müşteri SQL testlerinde rol temelli davranış örnekleri mevcut; bu yaklaşım yaygınlaştırılmalı.

**Yeniden üretilebilir tam test ortamı eksik.** Repoda `supabase/config.toml` ve `.github` CI akışı bulunmadı. Başka sağlayıcıda CI bulunabilir; incelenmedi. README yalnızca `test` yazıyor. Yeni geliştirici için temiz kurulum, test hesabı, migration, seed ayrımı ve deploy/geri dönüş adımları belgelenmeli.

**DB tipleri elle korunuyor.** `database.types.ts` bunu belirtiyor ve ilişkiler çoğunlukla boş; servislerde elle tür dönüşümleri var. Typecheck bu yüzden gerçek DB ilişkisinin yanlışlığını her zaman yakalayamaz. Migration’dan üretilen tip ve tip farkı kontrolü eklenmeli.

**Kendi koyduğumuz 200 satır kuralı aşılmış.** Sekiz TSX dosyası sınırın üzerinde; örneğin DashboardCalendar 292, DashboardStats 281, MyReservations 247 satır. Bunlar acil güvenlik sorunu değil. Hedefli düzenlemelerde bölünmeli; sırf satır azaltmak için büyük refactor yapılmamalı.

## 7. Üretim ortamında ayrıca kanıtlanması gerekenler

Bu bölüm doğrulanmış canlı açık listesi değil; repo dışı yayın koşullarıdır.

| Alan | Gerekli kanıt |
|---|---|
| Supabase | 001–012 ve sonraki düzeltmelerin gerçekten uygulanması; RLS ve GRANT envanteri; exposed schema/RPC izinleri; security advisor sonuçlarının incelenmesi. |
| Hesaplar | Demo admin/owner yok; admin MFA; e-posta doğrulama ve SMTP; signup/recovery redirect listesi; kötüye kullanım kontrolleri. |
| Web güvenliği | HTTPS ve gerçek response başlıkları. `vercel.json` yalnızca rewrite içeriyor: CSP, frame engelleme, nosniff, Referrer-Policy için repoda ayar görülmedi. Hosting ayrıca ekliyor olabilir. CSP mevcut inline tema script’i ve harita kaynaklarıyla test edilmeli. |
| Operasyon | Hata ve erişilebilirlik takibi, bildirim başarısızlığı alarmı, kota/maliyet alarmı, kimin müdahale edeceği. |
| Kurtarma | Ayrı staging/production ortamı, yedek ve geri yükleme tatbikatı, uygulanmış migration için geri dönüş planı. |
| Kişisel veri | Gerçek veri toplama noktalarında aydınlatma; saklama ve silme süreci; kullanıcı talep kanalı; müşteri notları ve kara liste gerekçeleri için erişim/saklama sınırları. Repo içinde tamamlanmış bir akış yok. Hukuki metin, sorumluluk ve aktarım koşulları ayrıca uzman tarafından belirlenmeli. |

Müşteri rehberindeki `deleted_at`, yalnızca listeden gizleme mekanizmasıdır; kişisel veriyi silme/anonimleştirme süreci olarak sunulmamalı. Hesap silmeyi de mevcut `ON DELETE CASCADE` ilişkilerini değerlendirmeden eklememeliyiz; rezervasyon geçmişini kaybetme riski var.

## 8. Hangi yeni özellikleri eklemeliyiz?

**İlk ürün kararı:** Pilotun vaadi “rezervasyon talebi + tesis onayı + ödeme tesiste” olmalı. Stratejideki “tam ödemeli müşteriye sat” uzun vadeli hedef; bugünkü uygulama bunu sunmuyor. Ödemeyi hemen eklemeyi önermiyorum ve mevcut kapsam yasağı korunmalı.

| Sıra | Öneri | Neden / ilk kabul kriteri |
|---|---|---|
| 1 | **Rezervasyon cevap süresi ve bildirim merkezi** | Bekleyen talep kaçmaz. Owner yeni talebi; müşteri onay, ret ve iptali görür. Süresi dolan talep kontrollü kapanır. Önce uygulama içi + güvenli e-posta; SMS/push sonra. |
| 2 | **Şifre kurtarma ve temel hesap yönetimi** | Giriş sorunu yaşayan kullanıcı geri dönebilir. Profil/iletişim güncelleme ve doğrulama açık biçimde çalışır. |
| 3 | **Tesisin yayına hazır olma kontrolü** | Admin aktif saha, spor, çalışma saatleri, fiyat kapsamı ve iletişim bilgisini görmeden eksik tesisi onaylamaz. Eksik her kalem owner’a gösterilir. |
| 4 | **Tarih istisnaları ve görünür takvim uyarıları** | Tatil, bakım, özel gün kapanışı yönetilir; mevcut rezervasyonlar kaybolmaz. Haftalık saat değişiminin etkisi önceden gösterilir. |
| 5 | **İşlem geçmişi ve güvenli iptal/yeniden planlama** | “Kim, ne zaman, neden değiştirdi?” yanıtlanır. Tek rezervasyon saat değişimi transaction içinde çakışma kontrolüyle yapılır; eski kayıt izlenebilir kalır. |
| 6 | **Müsaitliğe göre arama / boş saat alarmı** | Seçilen ilçe ve saatte gerçekten alınabilir saha bulmak dönüşümü artırır. Bekleme listesi, gerçek boşalmadan sonra bildirim üretir. Takvim güvenilir hale geldikten sonra. |
| 7 | **Kısıtlı personel hesabı** | Tesis çalışanı owner şifresini paylaşmadan takvim yönetir. Fiyat, tesis bilgisi ve kullanıcı yetkileri ayrı kontrol edilir. İlk pilot ihtiyacıyla önceliklendirilmeli. |
| 8 | **Veri talebi, dışa aktarma ve kontrollü anonimleştirme** | Kullanıcı/tesis talepleri takip edilir; saklama politikasıyla uyumlu uygulanır. Basit cascade delete olarak geliştirilmemeli. |

**Hedef tesislerle erkenden doğrulanacak model sınırı:** Şu an rezervasyonlar bir saatlik ve aynı gün içindeki aralıklarla sınırlı. Gece yarısını geçen 23:00–01:00 gibi çalışma, farklı süreler veya aralı mola ihtiyacı varsa bunu lansman vaadinden önce netleştirmek gerekir. Hepsini hemen eklemek yerine ilk tesis grubunun gerçek ihtiyacına göre ayrı faz tanımlayalım.

**Şimdilik ertele:** Oyuncu eşleştirme, sohbet, sosyal akış, mobil uygulama, çoklu dil, büyük framework geçişi ve gerçek ödeme. Bunlar mevcut canlıya çıkış engellerini çözmüyor. Mevcut favori/yorum/harita/ICS özelliklerini yeniden “yeni özellik” olarak geliştirmeye gerek yok.

## 9. SEO, ölçek ve ölçüm

- Public liste sayfalamasız; fiyat ve puan ilişkileri birlikte indiriliyor. İlk pilotta kabul edilebilir olsa da büyümede DB sayfalaması, doğru sıralama ve indeks/sorgu planı incelemesi gerekir. “1000’den fazla tesiste sorun yok” gibi bir ölçek iddiası şu an kanıtlanmış değil.
- İstatistikleri son N satırdan tarayıcıda hesaplamak yerine seçilen dönem için sunucuda toplamak gerekir. Bugünkü tutarlar tahmini rezervasyon geliri; tahsilat değildir. No-show/tahsil edilmemiş kayıtların ayrımı açık olmalı.
- Sitemap sadece build anında üretiliyor; yeni onaylanan tesis hemen eklenmeyebilir. Canonical adresin üretim domain’iyle tutarlı olması ve sitemap’in gerçek tesisleri içermesi kontrol edilmeli.
- Tesis bazlı meta veriler React’te oluşturuluyor. Sosyal paylaşım önizlemeleri ve arama görünürlüğü gerçek bot/araçlarla doğrulanmalı. Önce ölçüm; ihtiyaç kanıtlanırsa prerender/SSR, zorunlu bir Next.js geçişi değil.
- Dönüşüm için başlangıç ölçümleri: arama → tesis detayı → slot seçimi → talep → owner onayı; medyan owner cevap süresi, süresi dolan talep oranı, çakışma oranı ve no-show. Ad/telefon/notları analitik olaylara taşımadan ölçülmeli.

## 10. Önerdiğim uygulama sırası ve çıkış kapısı

**Paket A — Veriyi koru:** G1 saha/tesis/geçmiş bütünlüğü, G2 kota ve bekleyen talep ömrü, G3 yorum yetkisi. G5 public RPC görünürlüğü ve G6 temel DB sınırlarını aynı güvenlik fazında kapat. Yeni migration kullan; geçmiş migration’ları değiştirme. Her bulgu için başarısız olması beklenen API/DB testi ekle.

**Paket B — Operasyonu güvenilir yap:** Owner ve customer ekran tazeliği, mevcut rezervasyonların kapanan saatlerde görünmesi, fiyat değişiminde yeniden onay, hesap kurtarma, G4 güvenli bildirim ve gerçek destek bilgileri. Sayfalama ve doğru istatistikleri tamamla.

**Paket C — Gerçek ortamda kanıtla:** Tam Supabase testi, otomatik kalite kapısı ve `TODO.md` Faz 10/13 tarayıcı senaryoları. Customer, iki ayrı owner ve admin oturumlarıyla pozitif/negatif erişim testleri; mobil/masaüstü ve klavye kontrolü. Demo hesapları, başlıklar, yedek ve alarm kontrolü.

**Paket D — Dar bölgede pilot:** Öneri olarak 3–5 tesis ve tek ilçe/şehir grubu. Birkaç hafta gerçek operasyonu izle; açıkça tesis onaylı/tesiste ödeme modelini anlat. Geniş lansmana rezervasyon kaçırma, veri kaybı veya çözümsüz erişim problemi kalmadan geç.

Yayın için önerdiğim somut kapı:

- [ ] G1–G3 doğrudan API/DB üzerinden artık tekrarlanamıyor.
- [ ] G4 etkinleştirilmeden önce makine kimliği ve tekrarlı olay testi geçiyor.
- [ ] Süresi dolan talep, owner onayı ve aynı slot çakışması birlikte test edilmiş.
- [ ] Owner/customer farklı cihazlarda durum değişimini belirlenen sürede görüyor.
- [ ] Kapalı gün/pasif saha mevcut rezervasyonu takvimden gizlemiyor.
- [ ] Ekrandaki fiyat değişirse kullanıcı yeni tutarı onaylıyor.
- [ ] Şifre kurtarma ve gerçek bildirim teslimatı çalışıyor.
- [ ] Üretimde demo hesap yok; admin MFA, yedekten dönüş ve alarm kanıtı var.
- [ ] Tip, lint, birim test, tam DB testi ve ana tarayıcı akışları başarılı.
- [ ] Destek ve kişisel veri süreçlerinin sorumluları/iletişim kanalları belirli.

**Benim önceliğim yeni özellik sayısını artırmak değil, mevcut rezervasyonu güvenle alıp tesise doğru şekilde ulaştırmak olur.** Bu kapı tamamlandıktan sonra proje, küçük bir pilotla gerçek kullanımdan öğrenmeye uygun hale gelir.
