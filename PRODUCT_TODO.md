# SahaSepeti — Strateji Bazlı Detaylı Ürün TODO

Bu belge, `strategy.md` içindeki ürün yönünü mevcut `TODO.md` ve çalışan MVP üzerine
uygulanabilir geliştirme işlerine dönüştürür. Tamamlanmış MVP fazlarını tekrar etmez;
bundan sonra yapılacak işleri ekran, veri modeli, servis, güvenlik, test ve kabul
kriterleriyle tarif eder.

Stratejide personel hesapları hızlı manuel rezervasyondan önce listelenmiş olsa da
bu uygulama planında müşteri rehberi ve hızlı kayıt önce alınmıştır. Bunun nedeni,
personelin yöneteceği günlük çekirdek akışın ve yetki kapsamının önce netleşmesini
sağlamaktır; personel fazı hemen arkasından gelir.

## 1. Planlama Kuralları

### Durum etiketleri

- `[ ]` Başlanmadı
- `[~]` Devam ediyor
- `[x]` Tamamlandı
- `[!]` Dış karar veya operasyon bağımlılığı var

### Öncelik etiketleri

- `P0`: Ürünü güvenli biçimde geliştirmek veya pilotu başlatmak için zorunlu
- `P1`: Stratejik değer önerisinin doğrudan parçası
- `P2`: P1 işlerini güçlendiren veya operasyon maliyetini düşüren
- `P3`: Veri ve kullanım oluştuktan sonra değerlendirilecek

### Uygulama sırası

Her veri modeli değişikliği aşağıdaki sırayla geliştirilir:

1. Yeni migration, index, trigger ve RLS politikaları
2. `src/types/database.types.ts` senkronizasyonu
3. Zod şemaları ve feature tipleri
4. Supabase servis fonksiyonları
5. TanStack Query hookları
6. Bileşenler ve route sayfaları
7. Unit test, DB güvenlik testi ve manuel senaryo
8. `typecheck`, `lint`, `build`, gerekiyorsa `npm test`

## 2. Ürün Kapsamı ve Karar Kapıları

### Değişmeyecek ana ilkeler

- [ ] Takvim doğruluğunu katalog büyüklüğünden öncele.
- [ ] Manuel ve tesis kaynaklı rezervasyonlardan komisyon hesaplama.
- [ ] Platform kaynaklı rezervasyonları kaynağıyla birlikte izlenebilir tut.
- [ ] Güvenilir ana takvimi olmayan tesiste anında rezervasyonu kapat.
- [ ] Sosyal akış, takım/oyuncu bulma, sohbet ve video özelliklerini kapsam dışında tut.
- [ ] Doğrulanmamış veya takvimi güvenilmez tesisi katalog büyütmek için yayınlama.

### Ödeme karar kapısı

- [!] Mevcut `CLAUDE.md` ve `AGENTS.md` gerçek ödeme entegrasyonunu yasaklıyor.
- [ ] Ödeme geliştirmesine başlamadan önce ürün kuralları bilinçli biçimde güncellenecek.
- [ ] Kapora seçeneği kaldırılacak; stratejiye göre tam ödeme modeli esas alınacak.
- [ ] Ücretsiz/geç iptal, no-show, tesis iptali, iade, hak ediş ve chargeback kuralları yazılı onaylanacak.
- [ ] Customer iptalinin doğrudan sonuçlanacağı veya owner onayına gideceği koşulları;
  rezervasyona kalan süre, ödeme/iade durumu, owner yanıt süresi ve yanıtsız kalma
  senaryosuyla birlikte karara bağla. Bu karar verilene kadar mevcut iptal akışını değiştirme.
- [ ] Lisanslı pazaryeri ödeme kuruluşundan teklif alınacak.
- [ ] Mali müşavir ve hukuk görüşü tamamlanacak.
- [ ] Bu kapı geçilmeden gerçek gateway anahtarı, checkout veya para hareketi eklenmeyecek.

## 3. Ekran Haritası

| Alan | Route | Değişiklik |
|---|---|---|
| Owner takvimi | `/panel/takvim` | Hızlı manuel kayıt, tekrar serisi, müşteri arama, tahsilat durumu |
| Owner müşterileri | `/panel/musteriler` | Yeni sayfa: geçmiş, bakiye, no-show, kara liste |
| Owner personeli | `/panel/personel` | Yeni sayfa: davet, rol ve tesis yetkileri |
| Owner tahsilatları | `/panel/tahsilatlar` | Yeni sayfa: alınan, bekleyen ve geciken tutarlar |
| Owner entegrasyonları | `/panel/entegrasyonlar` | Yeni sayfa: ana takvim, bağlantı ve senkronizasyon sağlığı |
| Owner fırsatları | `/panel/firsatlar` | Yeni sayfa: yaklaşan boş saatler ve indirim önerileri |
| Owner istatistikleri | `/panel/istatistik` | Kaynak, gün/saat, güvenilirlik ve gelir kırılımları |
| Tesis listesi | `/tesisler` | Tarih-saatte gerçek müsaitlik ve olanak filtreleri |
| Tesis detayı | `/tesis/:slug` | Güven rozeti, fiyat/fırsat gösterimi, rezervasyon modu |
| Rezervasyonlarım | `/rezervasyonlarim` | Tekrar serileri, ödeme/iade durumu ve yeniden rezervasyon |
| Hesabım | `/hesabim` | Yeni sayfa: profil, veri indirme ve hesap silme |
| Admin güvenilirlik | `/admin/guvenilirlik` | Yeni sayfa: güncellik, iptal ve senkronizasyon sorunları |
| Admin istatistik | `/admin/istatistik` | Yeni sayfa: bölge, arz, dönüşüm ve rezervasyon metrikleri |
| Admin denetim | `/admin/denetim-kaydi` | Yeni sayfa: kritik değişikliklerin audit log'u |

---

## Faz 13 — P0: Teknik Sağlamlaştırma ve Ana Akış Kontrolü

### Amaç

Çalışan MVP'yi yeni ürün fazlarına hazırlamak; büyüyen dosyaları sorumluluklarına
ayırmak, veri erişim kurallarını mimariye uygun hâle getirmek ve mevcut customer,
owner ve admin akışlarında regresyon olmadığını doğrulamak.

> Yerel `.env` bağlantısı ve uygulamanın ayağa kaldırılması tamamlandığı için ortam
> kurulumu, migration/seed tekrarı, Supabase CLI ve `test:db` hazırlığı bu fazın
> kapsamından çıkarılmıştır.

### 13.1 — Auth veri erişimini service katmanına taşı

- [x] `AuthProvider` içindeki `getSession` ve `onAuthStateChange` işlemlerini auth
  service üzerinden kullanılacak küçük ve tip güvenli fonksiyonlara taşı.
- [x] `AuthProvider` içinde yalnızca oturum state'i ve provider yaşam döngüsü kalsın.
- [x] İlk oturum yüklenirken mevcut loading ve hata davranışını koru.
- [ ] Giriş, çıkış ve oturum yenileme akışlarını manuel olarak kontrol et.

**Bize kazandırdığı fayda:**

- Tüm Supabase erişimleri aynı mimari kurala uyar.
- Auth davranışı tek noktadan değiştirilebilir ve daha kolay test edilir.
- Provider büyümez; ileride şifre sıfırlama veya e-posta doğrulama eklemek kolaylaşır.

**Geliştirme sonrası testler:**

- [ ] Oturumu kapalı kullanıcıyla uygulamayı aç; loading bittikten sonra public
  sayfanın gösterildiğini doğrula.
- [ ] Customer, owner ve admin hesaplarıyla ayrı ayrı giriş yap; doğru başlangıç
  ekranına ve izin verilen route'lara erişildiğini doğrula.
- [ ] Giriş yaptıktan sonra sayfayı yenile; oturumun kaybolmadığını ve kısa süreli
  yanlış route yönlendirmesi oluşmadığını doğrula.
- [ ] Çıkış yap; korumalı route'a geri dönüldüğünde giriş ekranına yönlendirildiğini doğrula.
- [ ] Hatalı e-posta/şifre dene; kullanıcı dostu Türkçe hata gösterildiğini doğrula.
- [ ] Giriş/çıkış işlemini art arda tekrarla; duplicate auth listener, iki toast veya
  birden fazla query tetiklenmediğini kontrol et.
- [x] Auth service için mümkün olan oturum dönüştürme ve hata eşleme davranışlarına
  unit test ekle.

### 13.2 — Dashboard servisini sorumluluklarına göre böl

- [x] `dashboard.service.ts` içindeki fonksiyonları mevcut davranışı değiştirmeden
  aşağıdaki servis gruplarına ayır:
  - Tesis yönetimi
  - Saha ve fiyat yönetimi
  - Takvim ve çalışma saatleri
  - Owner rezervasyon işlemleri
- [x] Import kullanan hookları yeni servis yollarına geçir.
- [x] Query key ve invalidation davranışlarının değişmediğini doğrula.
- [x] Eski servis dosyasında kullanılmayan export bırakma.

**Bize kazandırdığı fayda:**

- Yeni özellik eklerken 500+ satırlık tek dosyada çalışma zorunluluğu ortadan kalkar.
- Aynı dosyada yapılan paralel geliştirmelerde merge conflict riski azalır.
- Hata çıktığında ilgili tesis, takvim veya rezervasyon alanı daha hızlı bulunur.
- Faz 14 ve sonrasındaki yeni servisler doğru feature sınırına yerleştirilebilir.

**Geliştirme sonrası testler:**

- [ ] `/panel`, `/panel/tesisler`, `/panel/takvim`, `/panel/rezervasyonlar` ve
  `/panel/istatistik` sayfalarının veri yüklediğini doğrula.
- [ ] Tesis oluşturma/düzenleme ve onaya gönderme işlemlerini test et.
- [ ] Saha ekleme/düzenleme, aktif-pasif yapma ve fiyat kuralı işlemlerini test et.
- [ ] Çalışma saatlerini kaydet; sayfa yenilendiğinde aynı değerlerin geldiğini doğrula.
- [ ] Manuel rezervasyon ve saat bloklama oluştur; ilgili takvim hücresinin sayfayı
  yenilemeden güncellendiğini doğrula.
- [ ] Rezervasyon durum değişikliğinden sonra takvim, rezervasyon listesi ve özet
  kartlarının doğru query invalidation ile güncellendiğini doğrula.
- [ ] İki farklı owner ile dene; bir owner'ın diğer owner'ın tesis veya rezervasyonunu
  göremediğini/değiştiremediğini doğrula.
- [x] Taşınan servis exportları için typecheck çalıştır; eski import yolu kalmadığını
  `rg` ile kontrol et.

### 13.3 — Büyük ekran ve bileşenleri parçala

- [x] `VenueDetail.tsx` içinden galeri, tesis bilgileri, saha/slot seçimi ve yorum
  bölümlerini feature bileşenlerine ayır.
- [x] `VenueList.tsx` içinden filtre çubuğu, sonuç başlığı, liste ve mobil filtre
  kontrolünü ayır.
- [x] `CourtManager.tsx` içinden saha formu, saha kartı ve fiyat kuralı yönetimini ayır.
- [x] `CalendarSlotDialog.tsx` içinden manuel rezervasyon ve saat bloklama formlarını ayır.
- [x] Route sayfalarında yalnızca veri/hook bağlama ve görünüm kompozisyonu bırak.
- [x] Yeni bileşenleri 200 satır sınırının altında ve tek sorumlulukta tut.

**Ekranda ne değişecek:**

- Kullanıcı açısından tasarım veya akış değişmeyecek.
- Aynı butonlar, formlar, dialog'lar ve mesajlar korunacak.
- Bu iş görünür bir özellik değil; sonraki ekran değişikliklerini daha güvenli yapacak.

**Bize kazandırdığı fayda:**

- Bir ekran bölümü değiştirilirken diğer bölümlerin bozulma ihtimali azalır.
- Tekrarlayan rezervasyon, müşteri arama ve gelişmiş filtreler doğru bileşene eklenir.
- Kod inceleme, hata ayıklama ve unit test yazma süresi kısalır.
- Mobil ve masaüstü varyasyonlarını yönetmek kolaylaşır.

**Geliştirme sonrası testler:**

- [ ] `VenueDetail` ekranında galeri, lightbox, favori, saha sekmeleri, tarih seçimi,
  slot seçimi, rezervasyon dialog'u ve yorumların çalıştığını doğrula.
- [ ] `VenueList` ekranında metin/spor/il/ilçe filtrelerini, sıralamayı, harita
  görünümünü ve URL query parametrelerini test et.
- [ ] Liste filtreli durumdayken sayfayı yenile; aynı filtre ve sonuçların korunduğunu doğrula.
- [ ] `CourtManager` içinde saha, çalışma saati ve fiyat kuralı CRUD işlemlerini test et.
- [ ] `CalendarSlotDialog` içinde manuel rezervasyon ile bloklama arasında geçiş yap;
  bir formun state'inin diğerine sızmadığını doğrula.
- [ ] Dialog'u kaydetmeden kapatıp tekrar aç; eski form verisinin kalmadığını doğrula.
- [ ] İlgili ekranları en az 390 px mobil ve 1440 px masaüstü genişlikte kontrol et.
- [ ] Klavye ile tab sırası, dialog kapatma ve temel odak davranışını kontrol et.
- [ ] Refactor öncesiyle metin, CTA, route ve temel görsel düzenin aynı kaldığını karşılaştır.

### 13.4 — Loading, boş, hata ve başarı durumlarını denetle

- [x] Public tesis listesi ve tesis detayında skeleton, empty state, error ve retry
  davranışlarını kontrol et.
- [x] Owner tesis, takvim ve rezervasyon ekranlarında aynı durumları kontrol et.
- [x] Admin kuyruk ve liste ekranlarında aynı durumları kontrol et.
- [x] Her mutasyonda buton loading/disabled durumu ve çift tıklama korumasını doğrula.
- [x] Başarılı mutasyonlarda Türkçe toast, başarısız mutasyonlarda kullanıcı dostu
  hata mesajı gösterildiğini doğrula.
- [x] Boş durumlarda kullanıcıyı bir sonraki doğru aksiyona götüren CTA kullan.

**Ekranda ne değişecek:**

- Bağlantı hatasında boş/beyaz ekran yerine açıklama ve “Tekrar Dene” aksiyonu görünür.
- Veri yoksa yalnızca boş alan yerine yönlendirici mesaj ve CTA görünür.
- Kaydetme sırasında buton pasifleşir ve işlem durumu anlaşılır olur.
- Başarı veya hata sonucu tutarlı toast mesajıyla bildirilir.

**Bize kazandırdığı fayda:**

- Kullanıcı işlemin devam edip etmediğini anlar ve aynı kaydı iki kez oluşturmaz.
- Geçici ağ/Supabase hataları terk edilmeye yol açmadan toparlanabilir.
- Tüm customer, owner ve admin ekranlarında tutarlı ürün hissi oluşur.

**Geliştirme sonrası testler:**

- [ ] Tarayıcıda yavaş ağ simülasyonu aç; veri beklenirken skeleton'ın, yükleme
  bitince gerçek içeriğin gösterildiğini doğrula.
- [ ] Sonuç dönmeyecek filtre/veri kullan; her listede doğru empty state ve CTA'yı doğrula.
- [ ] Geçici ağ hatası veya başarısız Supabase isteği oluştur; hata mesajı ve
  “Tekrar Dene” aksiyonunun çalıştığını doğrula.
- [ ] Kaydet butonuna hızlıca birden fazla kez bas; tek DB kaydı ve tek toast oluştuğunu doğrula.
- [ ] Başarılı create/update/delete işlemlerinde doğru Türkçe toast gösterildiğini doğrula.
- [ ] Başarısız mutasyondan sonra form verisinin kaybolmadığını ve kullanıcının tekrar
  deneyebildiğini doğrula.
- [ ] Loading sırasında ilgili input ve aksiyonların yeni istek üretemeyecek biçimde
  disabled olduğunu doğrula.
- [ ] Boş, hata ve loading durumlarını mobil görünümde taşma/kırılma açısından kontrol et.

### 13.5 — Ana kullanıcı akışlarını uçtan uca kontrol et

- [ ] Customer kayıt olur; profilinin oluştuğunu ve doğru role sahip olduğunu doğrula.
- [x] Owner tesis oluşturur, saha/çalışma saati/fiyat ekler ve onaya gönderir.
- [x] Admin tesisi inceler ve onaylar; tesisin public listede göründüğünü doğrula.
- [x] Customer tesis detayından uygun slot seçer ve rezervasyon oluşturur.
- [x] Aynı saha ve saate ikinci rezervasyon dene; kullanıcı dostu çakışma hatasını doğrula.
- [x] Owner rezervasyonu onaylar, tamamlar ve uygun zamanda no-show işaretler.
- [x] Customer uygun rezervasyonu iptal eder.
- [x] Tamamlanmış rezervasyon için yorum oluşturma ve görüntüleme akışını doğrula.
- [ ] Her adımda customer'ın owner/admin ekranına, owner'ın başka tesise ve yetkisiz
  kullanıcının korumalı verilere erişemediğini kontrol et.

**Bize kazandırdığı fayda:**

- Yeni özelliklere başlamadan önce çalışan ürünün gerçek başlangıç noktası belgelenir.
- Kritik rezervasyon ve rol problemleri ileriki fazlarda büyümeden yakalanır.
- Sonraki her faz için tekrar kullanılabilecek bir regresyon kontrol listesi oluşur.
- Pilot tesiste kullanıcıya veya owner'a gösterilecek akışların hazır olduğu anlaşılır.

**Testin tamamlanma kaydı:**

- [x] Her senaryonun sonucunu “geçti/kaldı” olarak kaydet; kalan maddede hata adımı,
  beklenen sonuç ve gerçekleşen sonucu yaz.
- [ ] Kontrolü masaüstü ve mobil görünümde en az bir kez tamamla.
- [x] Test sırasında oluşturulan tesis, saha, rezervasyon ve yorum kayıtlarını ayırt
  edilebilir test verisi olarak işaretle veya kontrol sonunda güvenli biçimde temizle.
- [ ] Browser console'da beklenmeyen hata ve başarısız network isteği kalmadığını kontrol et.
- [x] `npm run typecheck`, `npm run lint`, `npm run build` ve `npm test` çıktılarını
  fazın tamamlanma notuna ekle.

### Faz 13 kabul kriterleri

- [ ] Refactor sonrasında mevcut ekranların davranışı ve görünümü bozulmamıştır.
- [ ] Customer, owner ve admin ana senaryoları baştan sona tamamlanabilir.
- [x] Çift rezervasyon ve rol koruması beklendiği gibi çalışır.
- [ ] İncelenen ekranlarda eksik loading, empty, error veya toast durumu kalmaz.
- [x] `npm run typecheck`, `npm run lint`, `npm run build` ve `npm test` sıfır hata verir.
- [ ] Ana akışlarda kritik veya yüksek önem dereceli açık hata kalmaz.

---

## Faz 14 — P0: Rezervasyon Kaynağı ve Takvim Veri Temeli

### Amaç

Manuel, platform ve gelecekte dış sağlayıcıdan gelen rezervasyonları birbirinden
ayırmak; komisyon ve güvenilirlik hesaplarının temelini kurmak.

### Veri modeli

- [ ] `reservation_source` enum ekle: `marketplace`, `manual`, `block`, `external`.
- [ ] `reservations.source` alanını ekle ve mevcut kayıtlar için güvenli varsayılan belirle.
- [ ] `created_by` alanı ekle; işlemi yapan kullanıcıyı kaydet.
- [ ] Misafir rezervasyonlar için profil FK'sına bağımlı olmayan müşteri referansı tasarla.
- [ ] `external_provider` ve `external_reservation_id` alanlarını şimdilik nullable ekle.
- [ ] Dış kimlikler için gerekli unique/index kurallarını ekle.
- [ ] Owner'ın marketplace kaynağını değiştirmesini DB trigger/RLS ile engelle.

### Ekranda ne değişecek

- [ ] `/panel/takvim` kartlarında kaynak rozeti göster: “SahaSepeti”, “Telefon”, “Blok”, “Dış sistem”.
- [ ] `/panel/rezervasyonlar` listesine “Kaynak” filtresi ve kolonu ekle.
- [ ] `/panel/istatistik` ekranına platform/manual rezervasyon dağılımı ekle.
- [ ] Rezervasyon detayında kaynağı salt okunur göster.

### Servis ve otomatik test görevleri

- [ ] Customer rezervasyonlarını her zaman `marketplace` olarak oluştur.
- [ ] Owner hızlı rezervasyonlarını `manual`, blokları `block` olarak oluştur.
- [ ] Kaynak değerini istemciden serbestçe kabul etme; servis ve DB tarafında normalize et.
- [ ] Kaynak değiştirme ve başka owner verisine erişim için pgTAP testleri yaz.
- [ ] İstatistik hesaplarının kaynak ayrımını unit test ile doğrula.

### Bize kazandırdığı fayda

- Platformun getirdiği rezervasyon ile tesisin kendi müşterisi kesin biçimde ayrılır.
- Gelecekte komisyon yalnızca doğru rezervasyonlara uygulanabilir.
- Owner hangi kanalın ne kadar rezervasyon ve gelir ürettiğini görebilir.
- Dış takvim ve ödeme entegrasyonları için geriye dönük veri dönüşümü ihtiyacı azalır.

### Geliştirme sonrası testler

- [ ] Migration öncesi mevcut rezervasyonların migration sonrasında kaybolmadığını ve
  güvenli kaynak değeri aldığını doğrula.
- [ ] Customer olarak rezervasyon oluştur; kaynağın istemci göndermese de
  `marketplace` olduğunu doğrula.
- [ ] Owner takviminden manuel rezervasyon ve blok oluştur; kaynakların sırasıyla
  `manual` ve `block` olduğunu doğrula.
- [ ] İstemciden değiştirilmiş `source`, `created_by` ve dış provider alanları gönder;
  DB'nin bunları reddettiğini veya güvenli değere normalize ettiğini doğrula.
- [ ] Owner olarak marketplace rezervasyonunun kaynağını değiştirmeyi dene; işlemin
  hem UI/service hem doğrudan DB isteğinde engellendiğini doğrula.
- [ ] Kaynak filtresinin liste, toplam sayı ve istatistik dağılımında aynı sonucu verdiğini doğrula.
- [ ] İki owner ile test et; diğer tesise ait kaynak ve rezervasyon bilgisinin okunamadığını doğrula.
- [ ] Mobil ve masaüstünde kaynak rozetlerinin anlaşılır, tutarlı ve taşmadan göründüğünü kontrol et.

### Kabul kriterleri

- [ ] Her rezervasyonun kaynağı sorgulanabilir ve değiştirilemez biçimde bellidir.
- [ ] Manuel/blok rezervasyonlar gelecekte komisyon hesabına girmez.
- [ ] Eski kayıtlar migration sonrasında bozulmadan görüntülenir.

---

## Faz 15 — P0: Tekrarlayan Haftalık Rezervasyon

### Amaç

Owner'ın “her Salı 20:00” gibi abonelikleri tek işlemle oluşturabilmesi ve tek hafta
istisnasını tüm seriyi bozmadan yönetebilmesi.

### Veri modeli

- [ ] `reservation_series` tablosu oluştur.
- [ ] Alanları tanımla: venue, court, customer, weekday, start/end time, başlangıç/bitiş tarihi, durum, kaynak.
- [ ] `reservations.series_id` nullable FK ekle.
- [ ] Tek rezervasyon istisnaları için `series_occurrence_status` veya eşdeğer model belirle.
- [ ] Seriyi oluşturma RPC'sinde bütün tarihleri ve çakışmaları DB transaction içinde doğrula.
- [ ] Kısmi başarıya izin verme; kullanıcı açıkça seçmedikçe seri atomik oluşsun.
- [ ] Seri güncelleme seçeneklerini tanımla: “yalnızca bu”, “bu ve sonrası”, “tüm seri”.
- [ ] RLS: owner yalnızca kendi tesisindeki serileri yönetebilsin.

### Ekranda ne değişecek — `/panel/takvim`

- [ ] Boş slota tıklanan dialog'a “Her hafta tekrarla” seçeneği ekle.
- [ ] Seçildiğinde bitiş tarihi veya tekrar sayısı alanını göster.
- [ ] Kaydetmeden önce oluşturulacak tarihlerin özetini göster.
- [ ] Çakışan haftaları tarih ve saat olarak listele.
- [ ] Kullanıcıya “Seriyi oluşturma” ve izin verilirse “Uygun haftaları oluştur” seçeneklerini sun.
- [ ] Seri rezervasyonlarında tekrar ikonunu ve seri adını göster.
- [ ] Seri kaydına tıklanınca tek kayıt/gelecek/tüm seri aksiyonlarını aç.

### Ekranda ne değişecek — `/panel/rezervasyonlar`

- [ ] “Tekrarlayan” filtresi ekle.
- [ ] Seri grubunu açılır satır veya detay Sheet içinde göster.
- [ ] Seri iptalinde etkilenecek rezervasyon sayısını onay dialog'unda belirt.

### Servis ve testler

- [ ] Seri önizleme, oluşturma, güncelleme ve iptal servislerini yaz.
- [ ] Query key'leri seri ve günlük takvim invalidation'ını kapsasın.
- [ ] Yaz/kış saati varsayımı yapma; `yyyy-MM-dd` ve `HH:mm` taşıma kuralını koru.
- [ ] Ay sonu, yıl sonu, kapalı gün, fiyat eksikliği ve çakışma testleri yaz.
- [ ] EXCLUDE constraint'in seri üretiminde de son güvenlik katmanı olduğunu doğrula.

### Bize kazandırdığı fayda

- Owner haftalık aboneleri tek tek girmek yerine tek işlemle yönetir.
- Takvim giriş süresi ve unutulan rezervasyon riski azalır.
- Tek haftalık iptal/değişiklik tüm müşteri serisini bozmaz.
- Düzenli müşteriler için tesisin gelecek doluluğu daha doğru görünür.

### Geliştirme sonrası testler

- [ ] Dört haftalık çakışmasız seri oluştur; doğru tarihlerde tam dört rezervasyon
  ve tek seri kaydı oluştuğunu doğrula.
- [ ] Ay ve yıl sınırını geçen seri oluştur; hafta günü ve saatlerin kaymadığını doğrula.
- [ ] Kapalı gün, fiyatı olmayan slot ve geçmiş tarih içeren seri dene; açıklayıcı
  hata ve doğru tarih listesinin gösterildiğini doğrula.
- [ ] Haftalardan biri doluyken atomik seri oluştur; hiçbir haftanın yazılmadığını doğrula.
- [ ] “Uygun haftaları oluştur” destekleniyorsa yalnızca açıkça onaylanan uygun
  haftaların oluştuğunu ve atlananların raporlandığını doğrula.
- [ ] “Yalnızca bu”, “bu ve sonrası” ve “tüm seri” güncelleme seçeneklerini ayrı ayrı test et.
- [ ] Tek haftayı iptal et; diğer rezervasyonların ve seri devamının değişmediğini doğrula.
- [ ] Geçmiş rezervasyonu içeren seriyi güncelle; geçmiş kayıtların değişmediğini doğrula.
- [ ] Aynı anda iki seri oluşturma isteği gönder; EXCLUDE constraint nedeniyle
  çift rezervasyon oluşmadığını doğrula.
- [ ] Seri değişikliğinden sonra takvim ve rezervasyon listesinin yenilemesiz güncellendiğini doğrula.

### Kabul kriterleri

- [ ] Owner en fazla üç etkileşimle haftalık seri oluşturabilir.
- [ ] Tek hafta iptali diğer haftaları etkilemez.
- [ ] Aynı saha/saatte hiçbir seri çift rezervasyon üretemez.
- [ ] Gelecekteki seri değişikliği geçmiş kayıtları değiştirmez.

---

## Faz 16 — P0: Müşteri Rehberi ve 5–10 Saniyelik Manuel Rezervasyon

### Amaç

Telefon görüşmesi bitmeden müşteri bulunup rezervasyonun kaydedilebildiği hızlı owner
akışını oluşturmak.

### Veri modeli

- [ ] `venue_customers` tablosu oluştur.
- [ ] Minimum alanlar: venue, normalized_phone, display_name, notes, last_booking_at.
- [ ] Telefonu normalize eden DB fonksiyonu veya kontrollü servis kuralı belirle.
- [ ] Aynı tesiste aynı normalize telefon için duplicate oluşmasını engelle.
- [ ] Platform hesabıyla eşleştirme alanını nullable ve gizlilik kontrollü tut.
- [ ] `customer_flags` için no-show sayısı, kara liste durumu ve nedeni tasarla.
- [ ] Müşteri verisine yalnızca ilgili tesis owner/personeli erişebilsin.

### Ekranda ne değişecek — `/panel/takvim`

- [ ] Boş slota tıklanınca imleci doğrudan müşteri arama alanına getir.
- [ ] Ad, telefon veya telefonun son dört hanesiyle debounce arama yap.
- [ ] Son kullanılan müşterileri ilk sonuçlarda göster.
- [ ] Sonuç satırında ad, maskeli telefon, son rezervasyon ve no-show uyarısı göster.
- [ ] Sonuç yoksa aynı alandan hızlı müşteri oluştur.
- [ ] Varsayılanları otomatik doldur: saha, tarih, saat, fiyat, kaynak=`manual`.
- [ ] “Kaydet” ve “Her hafta tekrarla” aksiyonlarını tek görünümde tut.
- [ ] Başarılı kayıtta dialog'u kapatıp takvimi anında güncelle.
- [ ] İşlem süresini ölçmek için PII içermeyen süre metriği üret.

### Ekranda ne değişecek — Yeni `/panel/musteriler`

- [ ] Arama, aktif/kara liste/no-show filtreleri ekle.
- [ ] Müşteri kartında toplam rezervasyon, son ziyaret, iptal ve no-show sayısını göster.
- [ ] Detay Sheet içinde rezervasyon geçmişini göster.
- [ ] Not ekleme/düzenleme aksiyonu ekle.
- [ ] Kara listeye alma ve çıkarma için gerekçeli onay dialog'u ekle.
- [ ] Kara listedeki müşteri seçilirse takvim dialog'unda engelleyici uyarı göster.

### Bize kazandırdığı fayda

- Telefonla gelen rezervasyon hedeflenen 5–10 saniyede kaydedilebilir.
- Tekrarlayan müşterinin bilgileri yeniden yazılmaz ve hatalı telefon kaydı azalır.
- Owner müşteri geçmişi, iptal ve no-show davranışını tek yerde görür.
- Kara liste ve notlar sayesinde tesis çalışanları aynı operasyon bilgisini paylaşır.

### Geliştirme sonrası testler

- [ ] Yeni müşteriyi farklı geçerli Türkiye telefon biçimleriyle oluştur; tek normalize
  değer saklandığını doğrula.
- [ ] Aynı telefonu boşluk, `+90`, baştaki `0` gibi farklı biçimlerle tekrar ekle;
  duplicate müşteri oluşmadığını doğrula.
- [ ] Ad, tam telefon ve son dört haneyle arama yap; doğru ve yalnızca ilgili tesis
  müşterilerinin geldiğini doğrula.
- [ ] Aynı son dört haneye sahip birden fazla müşteri olduğunda ayırt edilebilir
  sonuçlar gösterildiğini doğrula.
- [ ] Arama sırasında hızlı yaz/sil; eski debounce sonucunun yeni sorgunun üzerine yazmadığını doğrula.
- [ ] Kayıtlı müşteriyle manuel rezervasyonu kronometreyle en az beş kez tamamla;
  medyan sürenin 10 saniyenin altında olduğunu doğrula.
- [ ] Kara listedeki müşteriyle rezervasyon dene; uyarı ve belirlenen engel kuralını doğrula.
- [ ] Müşteri notu/no-show bilgisini güncelle; liste ve detay Sheet'in yenilendiğini doğrula.
- [ ] İki owner ile test et; diğer tesisin müşteri araması, geçmişi ve notları görünmemeli.
- [ ] Browser console, network hata mesajı ve analytics payload'ında açık telefon/e-posta olmadığını kontrol et.

### Kabul kriterleri

- [ ] Daha önce kayıtlı müşteriyle manuel rezervasyon medyan 10 saniyenin altında tamamlanır.
- [ ] Telefonun son dört hanesiyle doğru tesis müşterileri bulunur.
- [ ] Bir tesis başka tesisin müşteri rehberini göremez.
- [ ] Log, analytics ve hata mesajlarına açık telefon/e-posta yazılmaz.

---

## Faz 17 — P1: Personel Hesapları ve Yetkileri

### Amaç

Owner'ın tesis çalışanlarına tesis ayarlarını değiştirmeden günlük rezervasyon işlemi
yapabilecek sınırlı erişim vermesi.

### Yetki modeli

- [ ] `venue_staff` ve `staff_invites` tablolarını oluştur.
- [ ] İlk roller: `manager`, `reception`, `viewer`.
- [ ] Yetki matrisi yaz: takvim görme, manuel kayıt, durum değiştirme, müşteri görme, rapor görme.
- [ ] Tesis düzenleme, fiyat değiştirme ve personel yönetimini yalnızca owner/manager'a sınırla.
- [ ] Davet token'larını hash'li ve süreli sakla.
- [ ] Personelin tesisten çıkarılmasını ve davetin iptalini destekle.
- [ ] Tüm politikaları owner/staff/admin kombinasyonlarıyla pgTAP testine ekle.

### Ekranda ne değişecek — Yeni `/panel/personel`

- [ ] Personel listesi, durum ve rol rozeti göster.
- [ ] “Personel davet et” dialog'u ekle.
- [ ] Davette e-posta, tesisler ve rol seçimi yaptır.
- [ ] Bekleyen daveti yeniden gönder/iptal et aksiyonları ekle.
- [ ] Rol değişikliğinde yetki özetini onay dialog'unda göster.
- [ ] Son owner'ın kendi yetkisini kaybetmesini engelle.

### Panel davranışı

- [ ] Sidebar öğelerini kullanıcının yetkisine göre göster.
- [ ] Yetkisiz aksiyonları yalnızca gizleme; route guard ve RLS ile engelle.
- [ ] Ekran başlığında çalışılan tesis bağlamını göster.
- [ ] Birden fazla tesise yetkili personel için tesis değiştirici ekle.

### Bize kazandırdığı fayda

- Owner hesabını paylaşmadan günlük işi personele devredebilir.
- Hatalı veya yetkisiz fiyat/tesis değişikliği riski azalır.
- Personel değişiminde tek şifreyi herkeste yenileme ihtiyacı ortadan kalkar.
- Hangi işlemi hangi çalışanın yaptığı izlenebilir hâle gelir.

### Geliştirme sonrası testler

- [ ] Geçerli davet oluştur, kabul et ve doğru tesis/rol atamasını doğrula.
- [ ] Süresi geçmiş, iptal edilmiş ve daha önce kullanılmış davet token'larını dene;
  tümünün reddedildiğini doğrula.
- [ ] `reception` hesabıyla takvim görüntüleme ve manuel rezervasyon oluşturmayı test et;
  tesis/fiyat/personel değişikliğinin engellendiğini doğrula.
- [ ] `viewer` hesabıyla tüm mutasyonları hem UI hem doğrudan servis/DB isteğinde dene;
  değişiklik oluşmadığını doğrula.
- [ ] `manager` rolünün onaylanan yetki matrisine uygun tüm izinlerini test et.
- [ ] Birden fazla tesise yetkili personelde tesis değiştiriciyi kullan; query ve
  mutasyonların seçili tesisle sınırlı kaldığını doğrula.
- [ ] Personelin rolünü değiştir; menü ve aksiyonların oturum yenilemeden doğru güncellendiğini doğrula.
- [ ] Personeli tesisten çıkar; açık oturumun en geç query yenilemesinde erişimi kaybettiğini doğrula.
- [ ] Son owner'ı çıkarmayı veya yetkisiz role indirmeyi dene; işlemin engellendiğini doğrula.
- [ ] Owner/staff/admin kombinasyonlarının RLS matrisini otomatik DB testleriyle doğrula.

### Kabul kriterleri

- [ ] Reception rezervasyon oluşturabilir fakat tesis/fiyat düzenleyemez.
- [ ] Viewer hiçbir mutasyon yapamaz.
- [ ] Yetki iptal edildiğinde aktif oturum en geç bir query yenilemesinde erişimi kaybeder.

---

## Faz 18 — P1: Tahsilat, Alacak ve Finansal Görünüm

### Amaç

Gerçek gateway eklemeden owner'ın manuel rezervasyonlardaki tahsilat durumunu ve
gelecekteki platform hak ediş yapısını aynı kavramsal modelde görebilmesi.

### Veri modeli

- [ ] `collection_status` belirle: `unpaid`, `partial`, `paid`, `waived`.
- [ ] Manuel tahsilat kayıtları için `reservation_collections` tablosu oluştur.
- [ ] Tutar, yöntem, tahsilat zamanı, kaydeden kullanıcı ve açıklama alanlarını ekle.
- [ ] Tahsilat toplamının rezervasyon tutarını aşmasını DB seviyesinde engelle.
- [ ] Kayıt silmek yerine ters kayıt veya audit edilebilir düzeltme modeli kullan.
- [ ] Gelecekteki komisyon/hak ediş alanlarını placeholder olarak ayır; para transferi yapma.

### Ekranda ne değişecek — `/panel/takvim` ve rezervasyon detayları

- [ ] Slot kartında “Ödenmedi”, “Kısmi”, “Ödendi” rozeti göster.
- [ ] Manuel rezervasyon dialog'una başlangıç tahsilat durumu ekle.
- [ ] Rezervasyon detayına “Tahsilat ekle” aksiyonu koy.
- [ ] Kalan tutarı açık biçimde göster.

### Ekranda ne değişecek — Yeni `/panel/tahsilatlar`

- [ ] Bugün/hafta/ay dönem seçici ekle.
- [ ] Toplam rezervasyon tutarı, tahsil edilen ve bekleyen tutar kartları ekle.
- [ ] Geciken alacaklar listesini göster.
- [ ] Tesis, müşteri, durum ve kaynak filtreleri ekle.
- [ ] CSV dışa aktarma ekle; yalnızca kullanıcının yetkili olduğu verileri üret.
- [ ] Platform kaynaklı gelecekteki hak ediş alanını “Yakında” olarak yanlış vaat vermeden ayır.

### Bize kazandırdığı fayda

- Owner gün sonunda ne kadar para aldığını ve ne kadar alacağı kaldığını görebilir.
- Personelin kaydettiği tahsilatlar kişi ve zaman bazında izlenebilir.
- Manuel tahsilat ile gelecekteki platform hak edişi birbirine karışmaz.
- Tesis kendi muhasebe kontrolü için veriyi dışa aktarabilir.

### Geliştirme sonrası testler

- [ ] Ödenmemiş rezervasyona kısmi tahsilat ekle; kalan tutar ve rozetin doğru güncellendiğini doğrula.
- [ ] Kalan tutarı tamamen tahsil et; durumun `paid` olduğunu ve toplamların değiştiğini doğrula.
- [ ] Rezervasyon tutarını aşan tahsilat gönder; DB ve UI tarafından reddedildiğini doğrula.
- [ ] Tahsilat düzeltmesi/ters kaydı oluştur; geçmiş kaydın silinmediğini ve toplamın doğru hesaplandığını doğrula.
- [ ] İptal/no-show rezervasyonlarının finansal kurala göre doğru listelendiğini doğrula.
- [ ] Bugün, hafta ve ay filtrelerinde kart toplamları ile liste satırlarını karşılaştır.
- [ ] Tesis, müşteri, kaynak ve durum filtrelerinin birlikte doğru sonuç verdiğini doğrula.
- [ ] CSV indir; satır sayısı, Türkçe karakterler, para/tarih biçimi ve toplamların ekranla eşleştiğini doğrula.
- [ ] Reception/manager/owner rollerinin finansal görüntüleme ve kayıt yetkilerini matrise göre test et.
- [ ] Başka owner'ın tahsilatını sorgulamayı dene; sonuç dönmediğini doğrula.
- [ ] Manuel tahsilatın komisyon veya platform hak edişi üretmediğini doğrula.

### Kabul kriterleri

- [ ] Owner seçilen dönemin tahsil edilen ve bekleyen tutarını açıklayabilir.
- [ ] Manuel tahsilatlar komisyon/hak ediş gibi gösterilmez.
- [ ] Finansal değişikliklerin kim tarafından ve ne zaman yapıldığı izlenir.

---

## Faz 19 — P1: Takvim Güncelliği ve Tesis Güvenilirliği

### Amaç

Anında rezervasyonun yalnızca güvenilir envanterde açılmasını ve sorunlu tesislerin
otomatik olarak satıştan çıkarılmasını sağlamak.

### Veri modeli

- [ ] `inventory_provider` enum/tablo tasarla: başlangıçta `sahasepeti`, `manual`, `external`.
- [ ] `venues.inventory_provider` ve `booking_mode` alanlarını ekle.
- [ ] Booking mode seçenekleri: `instant`, `request`, `disabled`.
- [ ] `calendar_health` tablosu veya hesaplanmış görünüm oluştur.
- [ ] Son takvim değişikliği, son başarılı senkronizasyon, hata sayısı ve skor alanlarını tanımla.
- [ ] Güvenilirlik eşiklerini DB/config seviyesinde merkezi tut.
- [ ] Satış kapatma/açma değişikliklerini audit log'a yaz.

### Ekranda ne değişecek — Owner ekranları

- [ ] Panel ana sayfasına “Takvim sağlığı” kartı ekle.
- [ ] Kartta son güncelleme, güncellik skoru ve yapılması gereken aksiyonu göster.
- [ ] `/panel/entegrasyonlar` ekranında ana takvim seçimini göster.
- [ ] Manuel senkron modunda “Anında rezervasyon kapalı” açıklamasını göster.
- [ ] Sorun olduğunda doğrudan takvime/entegrasyona götüren CTA ekle.

### Ekranda ne değişecek — Public ekranlar

- [ ] Tesis kartında yalnızca güvenilir tesisler için “Anında rezervasyon” rozeti göster.
- [ ] Tesis detayında rezervasyon modunu açıkça anlat.
- [ ] `request` modunda ödeme/rezervasyon kesinleşmiş gibi davranma; talep akışı göster.
- [ ] `disabled` modundaki tesisin slot CTA'sını kapat ve uygun açıklama göster.
- [ ] Telefon ve hassas iletişim bilgisini stratejideki görünürlük kararına göre sınırla.

### Ekranda ne değişecek — Admin `/admin/guvenilirlik`

- [ ] Güncelliği 24 saati aşan tesisleri listele.
- [ ] Çakışma, tesis iptali ve senkronizasyon hata oranlarını göster.
- [ ] Satışa kapalı tesisleri nedenleriyle filtrele.
- [ ] Manuel kapat/aç aksiyonunda gerekçe zorunlu tut.

### Bize kazandırdığı fayda

- Müşteriye gösterilen “müsait” slotun gerçekten müsait olma olasılığı yükselir.
- Güncel olmayan tesisler otomatik olarak riskli satıştan çıkarılır.
- Owner sorunun nedenini ve düzeltmek için gereken aksiyonu görebilir.
- Admin sorunları müşteri şikâyeti gelmeden önce tespit edebilir.

### Geliştirme sonrası testler

- [ ] `instant`, `request` ve `disabled` modlarındaki üç tesisin public kart, detay
  ve CTA davranışlarını ayrı ayrı test et.
- [ ] Güvenilir tesiste “Anında rezervasyon” rozetinin; diğer modlarda doğru açıklamanın göründüğünü doğrula.
- [ ] Son güncelleme zamanını eşik dışına taşı; tesisin otomatik olarak anında satışa kapandığını doğrula.
- [ ] Takvim tekrar güncellendiğinde tanımlanan iyileşme kuralına göre satış modunun düzeldiğini doğrula.
- [ ] External provider hata/timeout durumu üret; yeni rezervasyonun fail-closed engellendiğini doğrula.
- [ ] `request` modunda rezervasyonun kesinleşmiş gibi gösterilmediğini doğrula.
- [ ] `disabled` modunda slot CTA'sının klavye ve doğrudan URL/servis yoluyla da kullanılamadığını doğrula.
- [ ] Public ekranda ödeme/rezervasyon öncesi gizlenmesi gereken telefon bilgisinin görünmediğini kontrol et.
- [ ] Admin manuel kapatma/açma işleminde boş gerekçeyi reddet; geçerli gerekçenin audit kaydına yazıldığını doğrula.
- [ ] Owner'ın başka tesisin sağlık skorunu veya hata detayını okuyamadığını doğrula.
- [ ] Eşik sınır değerlerini unit testlerle (`tam eşik`, `bir altı`, `bir üstü`) doğrula.

### Kabul kriterleri

- [ ] Güncelliği eşik altına düşen tesis yeni anında rezervasyon alamaz.
- [ ] Entegrasyon hatasında sistem fail-closed davranır.
- [ ] Satış durumunun neden değiştiği owner ve admin tarafından görülebilir.

---

## Faz 20 — P1: Genel Channel Manager Altyapısı

### Amaç

Dış sağlayıcı entegrasyonlarını rezervasyon motoruna gömmeden ortak bir adapter
sözleşmesi üzerinden yönetmek.

### Başlamadan önce

- [!] En az bir sağlayıcıyla resmi API/pilot görüşmesi tamamlanmalı.
- [!] Müsaitlik, hold, confirm, cancel, webhook ve reconciliation yetenekleri doğrulanmalı.
- [ ] Ekran kazıma, kullanıcı şifresi saklama veya UI otomasyonu yapılmayacağı sözleşmeye yazılmalı.

### Teknik çekirdek

- [ ] `InventoryProviderAdapter` sözleşmesini tanımla.
- [ ] Metotlar: availability, hold, confirm, cancel, webhook normalize, reconcile.
- [ ] `NativeAdapter` ile mevcut SahaSepeti akışını bu sözleşmeye geçir.
- [ ] Provider credential verilerini istemci erişiminden tamamen ayır.
- [ ] `external_connections`, `sync_events`, `webhook_events`, `outbox_events` tablolarını tasarla.
- [ ] Webhook event ID için idempotency constraint ekle.
- [ ] Retry sayısı, sonraki deneme zamanı ve dead-letter durumunu sakla.
- [ ] Periyodik tam mutabakat işi tasarla.
- [ ] Provider kesintisinde yeni rezervasyonu fail-closed kapat.

### Ekranda ne değişecek — `/panel/entegrasyonlar`

- [ ] Bağlı sağlayıcı, bağlantı durumu ve son başarılı senkronizasyonu göster.
- [ ] “Bağlantıyı test et” ve “Şimdi senkronize et” aksiyonları ekle.
- [ ] Son hataları PII içermeyen kullanıcı dostu mesajlarla göster.
- [ ] Owner'ın aynı anda yalnızca bir ana takvim seçmesine izin ver.

### Ekranda ne değişecek — Admin görünümü

- [ ] Sağlayıcı bazlı uptime, gecikme ve hata oranını göster.
- [ ] Retry/dead-letter olaylarını filtrelenebilir listele.
- [ ] Bağlantıyı güvenli biçimde devre dışı bırakma aksiyonu ekle.

### Bize kazandırdığı fayda

- Her dış sağlayıcı için rezervasyon çekirdeğini yeniden yazma ihtiyacı ortadan kalkar.
- Webhook tekrarı, provider kesintisi ve veri farkları kontrollü biçimde yönetilir.
- Bir entegrasyon bozulduğunda diğer tesis ve sağlayıcılar etkilenmez.
- Owner ve admin senkronizasyon sorununu görünür ve ölçülebilir biçimde takip eder.

### Geliştirme sonrası testler

- [ ] `NativeAdapter` üzerinden mevcut müsaitlik, rezervasyon ve iptal akışının eski
  davranışla aynı sonucu verdiğini doğrula.
- [ ] Aynı webhook event ID'sini iki veya daha fazla kez gönder; tek olay ve tek
  rezervasyon işlendiğini doğrula.
- [ ] Webhook'ları beklenen sıranın dışında gönder; durum makinesinin geriye veya
  geçersiz duruma geçmediğini doğrula.
- [ ] Provider timeout, 5xx ve geçersiz payload cevaplarını ayrı ayrı simüle et.
- [ ] Geçici hatada retry sayısı ve sonraki deneme zamanının arttığını doğrula.
- [ ] Maksimum retry sonrası olayın dead-letter durumuna geçtiğini ve admin ekranında göründüğünü doğrula.
- [ ] Mutabakat sorgusunda eksik/fazla/değişmiş rezervasyon üret; farkların raporlandığını doğrula.
- [ ] Provider erişilemiyorken availability/hold/confirm dene; yeni satışın fail-closed kapandığını doğrula.
- [ ] Aynı tesise ikinci ana provider bağlamayı dene; işlemin engellendiğini doğrula.
- [ ] “Bağlantıyı test et” ve “Şimdi senkronize et” aksiyonlarının loading, başarı ve hata durumlarını test et.
- [ ] Provider secret değerlerinin client bundle, network response, log ve hata mesajında bulunmadığını kontrol et.
- [ ] İki provider adapter'ı sahte implementasyonla çalıştır; ortak sözleşme testlerinin ikisinde de geçtiğini doğrula.

### Kabul kriterleri

- [ ] Aynı webhook tekrar geldiğinde ikinci rezervasyon oluşmaz.
- [ ] Provider erişilemiyorsa ödeme/rezervasyon başlatılmaz.
- [ ] Mutabakat farkları raporlanır ve izlenebilir biçimde düzeltilir.
- [ ] Yeni provider rezervasyon çekirdeğini değiştirmeden adapter olarak eklenebilir.

---

## Faz 21 — P1: Boş Saat Satış Motoru V1

### Amaç

Yaklaşan boş slotları owner onayıyla fırsata dönüştürmek ve takvimi güncel tutmanın
somut gelir faydasını göstermek.

### Veri modeli

- [ ] `discount_rules` ve `slot_promotions` tablolarını oluştur.
- [ ] Kalan süre, indirim oranı, hariç gün/saat, min/max fiyat alanlarını tanımla.
- [ ] V1'de otomatik yayın yerine owner onayı durumunu zorunlu tut.
- [ ] Orijinal fiyat, indirimli fiyat ve kural kaynağını sakla.
- [ ] Rezervasyon anında geçerli fiyatı DB tarafında yeniden doğrula.
- [ ] Promosyon ile normal fiyat kuralı önceliklerini deterministik yap.

### Ekranda ne değişecek — Yeni `/panel/firsatlar`

- [ ] Önümüzdeki 2, 6, 12 ve 24 saatteki boş slotları grupla.
- [ ] Slot başına önerilen indirim ve tahmini satış fiyatını göster.
- [ ] Tekli ve toplu onay aksiyonu ekle.
- [ ] Yoğun saatleri otomatik önerilerden hariç tutma ayarı ekle.
- [ ] Yayındaki, rezerve olan, süresi dolan ve iptal edilen fırsatları ayır.

### Ekranda ne değişecek — Public ekranlar

- [ ] Tesis kartında “Son dakika fırsatı” rozeti göster.
- [ ] Eski/yeni fiyatı erişilebilir biçimde göster; yanıltıcı geri sayım kullanma.
- [ ] Tesis detayında fırsat slotlarını öne çıkar.
- [ ] Fırsat filtresi ve sıralaması ekle.

### Ölçüm görevleri

- [ ] Promosyon gösterim, tıklama ve rezervasyon dönüşümünü PII olmadan ölç.
- [ ] Normalde boş kalacak slotlardan gelen ek rezervasyon sayısını raporla.

### Bize kazandırdığı fayda

- Takvimi güncel tutan owner boş kapasitesini ek gelire dönüştürebilir.
- İndirim sürekli fiyat düşürmek yerine yalnızca yaklaşan boş slotlara uygulanır.
- Owner öneriyi onayladığı için V1'de fiyat kontrolünü kaybetmez.
- Platform fırsatların gerçekten ek rezervasyon üretip üretmediğini ölçebilir.

### Geliştirme sonrası testler

- [ ] 6 ve 2 saat kalan boş slotlar oluştur; doğru kural ve indirim önerisinin seçildiğini doğrula.
- [ ] Hafta sonu yoğun saat istisnası tanımla; ilgili slotlara öneri çıkmadığını doğrula.
- [ ] Dolu, bloklu, geçmiş veya fiyatı olmayan slota promosyon üretilemediğini doğrula.
- [ ] Owner onayı olmadan promosyonun public ekranda görünmediğini doğrula.
- [ ] Tekli ve toplu onayı test et; yalnızca seçilen uygun slotların yayınlandığını doğrula.
- [ ] Yayındaki promosyonu iptal et; public kart ve tesis detayından kaldırıldığını doğrula.
- [ ] Promosyon süresini geçir; eski fiyatın checkout/rezervasyon servisinde kabul edilmediğini doğrula.
- [ ] Promosyonlu slot için eş zamanlı iki rezervasyon dene; yalnızca bir rezervasyon oluştuğunu doğrula.
- [ ] DB'de hesaplanan indirimli fiyat ile kart, tesis detayı ve rezervasyon özetindeki fiyatı karşılaştır.
- [ ] Gösterim, tıklama ve rezervasyon eventlerinin duplicate olmadığını ve PII içermediğini kontrol et.
- [ ] Mobil ve masaüstünde eski/yeni fiyatın erişilebilir, okunur ve yanıltıcı olmayan biçimde göründüğünü doğrula.

### Kabul kriterleri

- [ ] Süresi geçen promosyon yanlış fiyatla satın alınamaz.
- [ ] Owner onayı olmadan V1 promosyonu yayınlanmaz.
- [ ] Promosyon kaynaklı ek rezervasyonlar normal rezervasyonlardan raporda ayrılabilir.
- [ ] Yoğun saat istisnaları ve minimum fiyat sınırı her zaman uygulanır.

---

## Faz 22 — P1: Tarih-Saat Bazlı Gerçek Müsaitlik Filtresi

### Amaç

Kullanıcının yalnızca seçtiği tarih ve saatte gerçekten rezerve edilebilir tesisleri
görmesini sağlamak.

### Ekranda ne değişecek — `/tesisler`

- [ ] Tarihe ek olarak saat veya saat aralığı seçici ekle.
- [ ] “Yalnızca müsait tesisler” filtresi ekle.
- [ ] Olanak, kapalı/açık saha, fiyat aralığı ve anında rezervasyon filtrelerini ekle.
- [ ] Filtreleri URL query parametreleriyle paylaşılabilir tut.
- [ ] Mobil filtreleri mevcut Sheet yapısına ekle.
- [ ] Kartta seçilen zaman için gerçek başlangıç fiyatını göster.
- [ ] Sonuç yoksa yakın saat ve yakın ilçe önerileri göster.

### Backend ve performans

- [ ] Tarih-saat, sport, konum ve booking mode alan bir availability RPC tasarla.
- [ ] Çalışma saati, court aktifliği, fiyat, rezervasyon ve hold verilerini tek sorguda doğrula.
- [ ] Gerekli composite/partial indexleri sorgu planına göre ekle.
- [ ] Sayfalama ve deterministik sıralama uygula.
- [ ] Arama sonucu ile tesis detayındaki slot durumunun tutarlı olduğunu test et.

### Bize kazandırdığı fayda

- Kullanıcı uygun olmayan tesisleri tek tek açarak zaman kaybetmez.
- Arama sonucu ile tesis detayındaki takvim arasındaki güven farkı azalır.
- Daha nitelikli kullanıcı tesis detayına geldiği için rezervasyon dönüşümü yükselir.
- Yakın saat ve ilçe önerileri sonuçsuz aramadan çıkışı azaltır.

### Geliştirme sonrası testler

- [ ] Belirli tarih/saatte yalnızca bir sahası boş olan tesisi ara; tesisin sonuçta göründüğünü doğrula.
- [ ] Tüm sahaları dolu, bloklu, kapalı veya fiyatı olmayan tesislerin sonuçtan çıkarıldığını doğrula.
- [ ] `instant`, `request` ve `disabled` booking mode filtrelerini ayrı ayrı test et.
- [ ] Spor, il, ilçe, olanak, indoor/outdoor, fiyat ve saat filtrelerini tek tek ve birlikte test et.
- [ ] Mobil Sheet'te filtre uygula/temizle; sonuç sayısı ve aktif filtre özetinin güncellendiğini doğrula.
- [ ] Filtreli URL'yi yeni sekme ve farklı tarayıcıda aç; aynı filtrelerin geri yüklendiğini doğrula.
- [ ] Kartta gösterilen seçili saat fiyatını tesis detayındaki aynı slot fiyatıyla karşılaştır.
- [ ] Son slot arama ile rezervasyon tıklaması arasında dolduğunda kullanıcı dostu çakışma hatasını doğrula.
- [ ] Sonuç yok durumunda yakın saat/ilçe önerisinin geçerli sonuçlara yönlendirdiğini doğrula.
- [ ] Sayfalama sırasında duplicate veya eksik tesis oluşmadığını doğrula.
- [ ] Büyük veri setinde RPC sorgu planını incele; hedeflenen indexlerin kullanıldığını doğrula.
- [ ] Europe/Istanbul gün sınırına yakın saatlerde tarih kayması olmadığını test et.

### Kabul kriterleri

- [ ] Sonuçtaki her tesis seçilen zamanda en az bir seçilebilir sahaya sahiptir.
- [ ] Dolu veya fiyatı olmayan slot public sonuçta müsait sayılmaz.
- [ ] Filtre linki başka cihazda aynı aramayı açar.

---

## Faz 23 — P2: Bildirim Merkezi ve Bekleme Listesi

### Amaç

Rezervasyon değişikliklerini uygulama içinde izlemek ve dolu slot boşaldığında ilgili
kullanıcıyı haberdar etmek.

### Ekranda ne değişecek — Bildirim merkezi

- [ ] `notifications` tablosunu RLS ile oluştur.
- [ ] Header'a zil ve okunmamış sayaç ekle.
- [ ] Bildirim Sheet/sayfasında tür, zaman, okundu durumu ve ilgili CTA göster.
- [ ] Rezervasyon oluşturma, onay, iptal, değişiklik ve hatırlatma olaylarını üret.
- [ ] Toplu okundu işaretleme ekle.

### Bekleme listesi

- [ ] `slot_waitlist` tablosu oluştur.
- [ ] Dolu slotta “Boşalınca haber ver” CTA'sı göster.
- [ ] Aynı kullanıcı/slot için duplicate kaydı engelle.
- [ ] Slot boşaldığında sıradaki uygun kullanıcılara bildirim üret.
- [ ] Bildirimin rezervasyon garantisi olmadığını açıkça belirt.
- [ ] Rezervasyon oluşunca veya zaman geçince kayıtları kapat.

### E-posta bağımlılığı

- [!] Resend alan adı doğrulanmadan genel e-posta gönderimini açma.
- [!] Daha önce görünmüş API anahtarını aktivasyondan önce yenile.
- [ ] `NOTIFY_FROM_EMAIL` üretim adresini doğrula.
- [ ] Uygulama içi bildirimleri e-posta başarısızlığından bağımsız çalıştır.

### Bize kazandırdığı fayda

- Customer ve owner rezervasyon değişikliklerini uygulamaya geri dönmeden fark eder.
- Dolu slot boşaldığında talep kaybolmadan yeniden satış fırsatına dönüşür.
- Uygulama içi kanal e-posta sağlayıcısından bağımsız temel bildirim güvencesi sağlar.
- Okunmamış sayaç önemli aksiyonların gözden kaçmasını azaltır.

### Geliştirme sonrası testler

- [ ] Rezervasyon oluşturma, onay, iptal, değişiklik ve hatırlatma olaylarının doğru
  alıcı ve CTA ile bildirim ürettiğini doğrula.
- [ ] Aynı domain event/webhook'u tekrar gönder; duplicate bildirim oluşmadığını doğrula.
- [ ] Header sayacının yeni bildirimde arttığını, tek/toplu okundu işleminde azaldığını doğrula.
- [ ] Bildirim CTA'sına tıkla; doğru rezervasyon veya panel ekranına yönlendiğini doğrula.
- [ ] Customer, owner ve ikinci customer ile test et; kullanıcıların birbirinin bildirimini göremediğini doğrula.
- [ ] Dolu slota bekleme listesi kaydı ekle; aynı kullanıcı/slot için ikinci kaydın engellendiğini doğrula.
- [ ] Slot iptal ile boşalsın; uygun bekleme listesi kullanıcılarına tek bildirim gittiğini doğrula.
- [ ] Bildirim alan kullanıcılardan biri rezervasyon yaptığında slotun diğerlerine kesinleşmiş gibi gösterilmediğini doğrula.
- [ ] Slot zamanı geçince veya kullanıcı rezervasyon yapınca bekleme kaydının kapandığını doğrula.
- [ ] E-posta gönderimini hata verecek şekilde simüle et; uygulama içi bildirimin yine oluştuğunu doğrula.
- [ ] Bildirim metni, log ve event payload'larında gereksiz PII olmadığını kontrol et.
- [ ] Mobilde bildirim Sheet'i, okunmamış rozet ve uzun metin taşmalarını kontrol et.

### Kabul kriterleri

- [ ] Kullanıcı yalnızca kendi bildirimlerini görür.
- [ ] Aynı olay duplicate bildirim üretmez.
- [ ] Boşalan slot bildirimi yanlışlıkla rezervasyon kesinleşmiş izlenimi vermez.

---

## Faz 24 — P2: Admin Operasyonu, Audit ve Başarı Metrikleri

### Amaç

İlk bölge pilotunu güvenilirlik ve gelir metrikleriyle yönetebilmek.

### Veri modeli ve audit görevleri

- [ ] `audit_logs` tablosunu append-only oluştur.
- [ ] Tesis durum, satış modu, fiyat, personel rolü ve finansal düzeltmeleri kaydet.
- [ ] PII yerine entity ID ve güvenli metadata sakla.
- [ ] Audit kayıtlarının istemciden değiştirilmesini/silinmesini engelle.
- [ ] `/admin/denetim-kaydi` ekranına tarih, actor, entity ve event filtreleri ekle.

### Ekranda ne değişecek — `/admin/istatistik` ve `/admin/denetim-kaydi`

- [ ] Aktif ve online rezervasyona açık tesis sayısı.
- [ ] Şehir/ilçe bazlı aktif tesis kapsama oranı.
- [ ] Son 24 saatte güncel takvim oranı.
- [ ] Çakışma ve tesis kaynaklı iptal oranı.
- [ ] Aramadan uygun slot bulma oranı.
- [ ] Uygun slottan rezervasyona/ileride ödemeye dönüşüm.
- [ ] İlk rezervasyondan ikinci rezervasyona dönüş.
- [ ] Platform/manual/dış kaynak rezervasyon dağılımı.
- [ ] Fırsat motorunun doldurduğu ek slot sayısı.
- [ ] Tesis başına platform kaynaklı ek gelir.

### Başlangıç alarm eşikleri

- [ ] Takvim güncelliği `%95` altına düşünce uyar.
- [ ] Çift rezervasyon oranı `%0,1` üzerine çıkınca kritik alarm üret.
- [ ] Tesis kaynaklı iptal `%1` üzerine çıkınca inceleme kuyruğuna al.
- [ ] Entegrasyon kesintisinde gerçekleşen hatalı satışı kritik olay say.

### Pilot operasyonu

- [ ] İlk şehir ve 1–2 ilçeyi ürün kararı olarak seç.
- [ ] 20–30 aktif/doğrulanmış tesis hedef listesi hazırla.
- [ ] Tesis onboarding checklist'i oluştur: saha, fiyat, saat, fotoğraf, gelecek rezervasyonlar.
- [ ] Personel eğitimi ve ilk ay destek sürecini standartlaştır.
- [ ] Yeni bölge açılışı için minimum kapsama ve takvim doğruluğu kapısı belirle.

### Bize kazandırdığı fayda

- Ürün kararları kayıt veya indirme sayısı yerine gerçek pazar sağlığına dayanır.
- Takvim, iptal ve entegrasyon sorunları müşteri etkisi büyümeden görülür.
- Kritik değişikliklerde “kim, ne zaman, ne yaptı?” sorusu cevaplanır.
- Yeni bölge açılışı sezgi yerine ölçülebilir kalite kapılarına bağlanır.

### Geliştirme sonrası testler

- [ ] Tesis durumu, booking mode, fiyat, personel rolü ve finansal düzeltme değiştir;
  her biri için doğru actor/entity/event audit kaydı oluştuğunu doğrula.
- [ ] Audit kaydını istemciden güncellemeyi veya silmeyi dene; işlemin reddedildiğini doğrula.
- [ ] Audit metadata içinde telefon, e-posta, müşteri notu veya secret bulunmadığını kontrol et.
- [ ] Şehir/ilçe ve dönem filtrelerinde dashboard kartları ile detay listelerini karşılaştır.
- [ ] Takvim güncelliği, çakışma, tesis iptali ve kaynak dağılımı metriklerini bilinen
  küçük bir veri seti üzerinden elle hesaplayıp ekranla doğrula.
- [ ] `%95`, `%0,1` ve `%1` eşiklerinin hemen altı, eşiti ve üstü değerlerde alarm davranışını test et.
- [ ] Entegrasyon kesintisi olayı oluştur; kritik alarm ve ilgili detay bağlantısını doğrula.
- [ ] Admin olmayan kullanıcıyla admin istatistik ve audit route/API erişimini dene; reddedildiğini doğrula.
- [ ] Boş veri, kısmi veri ve büyük veri setinde grafik/tablo durumlarını kontrol et.
- [ ] Pilot onboarding checklist'ini örnek bir tesis üzerinde tamamla; zorunlu adım atlanınca hazır durumuna geçmediğini doğrula.
- [ ] Yeni bölge eşiği sağlanmadan bölgeyi aktif etmeyi dene; ürün kararındaki kapının uygulandığını doğrula.

### Kabul kriterleri

- [ ] Admin pilot bölgenin arz, güncellik, çakışma ve iptal sağlığını tek ekranda görebilir.
- [ ] Kritik değişikliklerin kim tarafından yapıldığı geriye dönük izlenebilir.
- [ ] Yeni bölge açma kararı ölçülebilir eşiklere dayanır.

---

## Faz 25 — P2: KVKK ve Hesap Yönetimi

### Amaç

Kullanıcıların kişisel verilerini self-servis biçimde yönetebilmesi.

### Ekranda ne değişecek — Yeni `/hesabim`

- [ ] Profil adı, telefon ve e-posta görünümü/düzenleme akışı ekle.
- [ ] E-posta değiştirme ve doğrulama durumunu göster.
- [ ] “Verilerimi indir” aksiyonu ekle.
- [ ] “Hesabımı sil” için açık sonuçları anlatan çok adımlı onay ekle.
- [ ] Aktif rezervasyon veya finansal kayıt varsa uygun engel/saklama açıklaması göster.

### Backend

- [ ] Veri dışa aktarmada profil, rezervasyon, favori ve yorum verilerini kapsa.
- [ ] Başka kullanıcı veya owner iç verisini dışa aktarmamayı test et.
- [ ] Silme/anonimleştirme politikasını finansal ve hukuki saklama gereksinimleriyle tanımla.
- [ ] Silme işlemini service-role kullanılan güvenli sunucu fonksiyonuna taşı.
- [ ] İşlem sonucunu audit log'a PII olmadan kaydet.

### Bize kazandırdığı fayda

- Kullanıcı kişisel verisi üzerinde şeffaf ve self-servis kontrol kazanır.
- Destek ekibinin manuel veri indirme/silme iş yükü azalır.
- KVKK taleplerinin tutarlı ve izlenebilir biçimde işlenmesi kolaylaşır.
- Silme ve anonimleştirme sırasında rezervasyon/finans kayıtlarının bütünlüğü korunur.

### Geliştirme sonrası testler

- [ ] Ad ve telefon güncelle; header/profil gibi ilgili görünümlerin yenilendiğini doğrula.
- [ ] Geçersiz telefon ve e-posta değişikliği dene; Türkçe doğrulama mesajlarını kontrol et.
- [ ] Veri indirme isteği oluştur; profil, rezervasyon, favori ve yorum kayıtlarının
  beklenen biçim ve Türkçe karakterlerle geldiğini doğrula.
- [ ] Export içinde başka kullanıcı, owner iç notu veya gereksiz hassas alan bulunmadığını kontrol et.
- [ ] Başka kullanıcı adına export endpoint'ini çağırmayı dene; erişimin reddedildiğini doğrula.
- [ ] Aktif rezervasyonu olan hesapta silme isteği dene; belirlenen engel ve açıklamanın gösterildiğini doğrula.
- [ ] Silinebilir test hesabını sil; auth erişiminin kapandığını ve gereksiz PII'nin
  silindiğini/anonimleştiğini doğrula.
- [ ] Silme sonrası korunması gereken rezervasyon ve finans kayıtlarının ilişkisel bütünlüğünü doğrula.
- [ ] Aynı silme isteğini tekrar gönder; idempotent ve kullanıcı dostu sonuç verdiğini doğrula.
- [ ] Service-role anahtarının client bundle ve network yanıtında bulunmadığını kontrol et.
- [ ] Export ve silme işlemlerinin audit kaydında PII bulunmadığını doğrula.

### Kabul kriterleri

- [ ] Kullanıcı yalnızca kendi verisini indirebilir.
- [ ] Hesap silme işlemi ilişkisel bütünlüğü veya finansal kayıtları bozmaz.
- [ ] Silinen kullanıcının gereksiz kişisel verisi tutulmaz.

---

## Faz 26 — P3 / Karar Kapılı: Tam Ödeme ve Hak Ediş

### Amaç

Marketplace rezervasyonlarında tam tutarı lisanslı ödeme kuruluşu üzerinden güvenli
biçimde almak; slotu ödeme süresince korumak, komisyonu ayırmak ve tesis hak edişini
izlenebilir hâle getirmek.

### Başlama koşulları

- [!] Ödeme karar kapısındaki tüm hukuk, mali ve ürün kararları tamamlanmış olmalı.
- [!] Projedeki “gerçek ödeme yok” kuralları ayrı bir kararla güncellenmiş olmalı.
- [!] Provider sandbox, marketplace/split-payment ve webhook yetenekleri doğrulanmış olmalı.

### Tasarlanacak akış

- [ ] Yaklaşık 5 dakikalık atomik slot hold modeli oluştur.
- [ ] Hold alınmadan checkout başlatma.
- [ ] Tutarı yalnızca DB fiyat kurallarından hesapla.
- [ ] Başarılı ödemede hold'u rezervasyona dönüştür.
- [ ] Başarısız/timeout ödemede hold'u serbest bırak.
- [ ] Ödeme alınmış fakat rezervasyon kesinleşmemişse otomatik iade başlat.
- [ ] Webhook'ları event ID ile idempotent işle.
- [ ] İade, chargeback, hak ediş bekliyor ve tesise ödendi durumlarını modelle.
- [ ] Manuel rezervasyonları komisyon ve hak ediş hesabından kesin olarak çıkar.
- [ ] Karar kapısı sonucuna göre `cancellation_requested` veya eşdeğer bir iptal talebi
  durumu tasarla; owner onayı gerekiyorsa yanıt süresi, otomatik sonuç ve bildirim
  davranışını tanımla.

### Ekranda ne değişecek — Customer ekranları

- [ ] Rezervasyon özeti ile ödeme adımını ayrı ve anlaşılır göster.
- [ ] Tam tutar, iptal/iade koşulları ve sağlayıcı güven bilgisini checkout öncesi göster.
- [ ] Başarı ekranında rezervasyon ve ödeme referansını göster.
- [ ] Başarısız/bekleyen sonuçlarda tekrar ödeme ve destek seçeneklerini göster.
- [ ] `/rezervasyonlarim` ekranında ödeme/iade durumlarını göster.
- [ ] Owner onayı gereken iptallerde “İptal talebi gönderildi” durumunu, son yanıt
  süresini ve talebin olası sonuçlarını açıkça göster.

### Ekranda ne değişecek — Owner ekranları

- [ ] `/panel/tahsilatlar` ekranına komisyon ve net hak ediş görünümü ekle.
- [ ] Hak ediş tarihi, bekleyen tutar ve tesise ödenen tutarı ayır.
- [ ] İade/chargeback durumlarını rezervasyonla ilişkilendir.
- [ ] Owner onayı gerektiren iptal taleplerini gerekçe, kalan süre ve finansal etkisiyle
  göster; onaylama/reddetme aksiyonlarını audit kaydına bağla.

### Bize kazandırdığı fayda

- Customer ödemeyi tamamladığında rezervasyonu anında ve güvenli biçimde kesinleşir.
- Owner platform kaynaklı rezervasyonun net hak edişini ve ödeme zamanını görebilir.
- Komisyon yalnızca platformun getirdiği, ödenmiş ve gerçekleşmiş rezervasyona uygulanır.
- Hold, idempotency ve otomatik iade çift satış ile para/rezervasyon uyumsuzluğunu azaltır.

### Geliştirme sonrası testler

> Bu testler yalnızca ödeme karar kapısı açıldıktan ve provider sandbox hesabı
> hazırlandıktan sonra çalıştırılır; gerçek kart veya üretim parası kullanılmaz.

- [ ] Aynı slot için iki customer ile eş zamanlı hold isteği gönder; yalnızca birinin hold alabildiğini doğrula.
- [ ] Hold süresi dolsun; slotun tekrar satılabilir olduğunu ve eski checkout'un kesinleşemediğini doğrula.
- [ ] İstemciden değiştirilmiş fiyat gönder; DB/provider'a yalnızca sunucu hesaplı tutarın gittiğini doğrula.
- [ ] Başarılı sandbox ödemesinde hold, ödeme, rezervasyon ve hak ediş durumlarının doğru sırayla oluştuğunu doğrula.
- [ ] Başarısız ve timeout ödemelerinde hold'un bırakıldığını ve rezervasyonun kesinleşmediğini doğrula.
- [ ] Ödeme başarılı, rezervasyon kesinleştirme başarısız senaryosunda otomatik iade sürecinin başladığını doğrula.
- [ ] Aynı webhook ve callback'i tekrarla; ikinci ödeme, rezervasyon, iade veya hak ediş oluşmadığını doğrula.
- [ ] Webhook'ları sıra dışı gönder; durum makinesinin geçersiz geriye geçişe izin vermediğini doğrula.
- [ ] Ücretsiz/geç iptal, tesis iptali, no-show ve chargeback senaryolarında onaylı finans kurallarını test et.
- [ ] Owner onaylı iptal modeli seçilirse onay, ret, zaman aşımı, yinelenen işlem ve
  yanıtsız owner senaryolarında rezervasyon ile iade durumlarının tutarlı kaldığını doğrula.
- [ ] Manuel rezervasyon ve manuel tahsilat için komisyon/hak ediş oluşmadığını doğrula.
- [ ] Komisyon, provider maliyeti, net hak ediş ve iade toplamlarını kuruş hassasiyetinde karşılaştır.
- [ ] Provider timeout/5xx durumunda yeni ödemenin fail-closed engellendiğini doğrula.
- [ ] Customer, owner ve admin'in yalnızca yetkili olduğu ödeme alanlarını görebildiğini doğrula.
- [ ] Başarı, bekliyor, başarısız ve iade ekranlarını mobil/masaüstünde test et.
- [ ] Kart verisi, provider secret ve hassas payload'ın log, DB ve client response'a yazılmadığını kontrol et.

### Kabul kriterleri

- [ ] Ödeme olmadan marketplace rezervasyonu kesinleşmez.
- [ ] Aynı webhook veya callback iki ödeme/rezervasyon üretmez.
- [ ] Platform manuel olarak müşteri parasını dağıtmaz; lisanslı provider akışı kullanılır.
- [ ] Entegrasyon kesintisinde hatalı satış sıfırdır.

---

## Faz 27 — P3: WhatsApp Takvim Asistanı

### Amaç

Owner ve yetkili personelin günlük müsaitlik sorgusu ile manuel rezervasyon girişini
resmi WhatsApp Business kanalı üzerinden, web panelindeki aynı güvenlik ve iş
kurallarıyla tamamlayabilmesini sağlamak.

### Başlama koşulları

- [!] Resmi WhatsApp Business API ve izinli mesaj şablonları kullanılmalı.
- [!] Personel yetki modeli, müşteri rehberi ve audit log tamamlanmış olmalı.

### İlk kapsam

- [ ] Owner'ın boşluk sorma ve manuel rezervasyon oluşturma komutlarını tasarla.
- [ ] Her mutasyonda tesis, saha, tarih, saat ve müşteri özetini onaylat.
- [ ] Serbest metni doğrudan DB işlemine dönüştürme; yapılandırılmış doğrulama uygula.
- [ ] Yetkisiz numara ve tesis erişimini reddet.
- [ ] Komut ve sonuçları PII minimumuyla audit et.
- [ ] Çakışmada mevcut kullanıcı dostu hata modelini kullan.

### Kullanıcı deneyiminde ne değişecek

- Owner/personel WhatsApp üzerinden uygun saat sorabilecek.
- Asistan bulunan tesis, saha, tarih ve saati özetleyip işlem öncesi açık onay isteyecek.
- Onaydan sonra web panelindeki aynı manuel rezervasyon servisi kullanılacak.
- Başarılı işlem rezervasyon numarasıyla, başarısız işlem düzeltilebilir Türkçe mesajla bildirilecek.
- Kritik düzenleme ve iptal işlemleri ilk kapsam dışında kalacak veya ayrıca güçlü onay isteyecek.

### Bize kazandırdığı fayda

- Owner telefon görüşmesi veya mesajlaşma sırasında panel açmadan takvimi güncel tutabilir.
- Manuel rezervasyonların unutulması ve geç girilmesi azalır.
- Personel alışık olduğu kanalı kullanırken aynı yetki ve çakışma kuralları korunur.
- Daha güncel takvim, public taraftaki yanlış müsaitlik riskini azaltır.

### Geliştirme sonrası testler

- [ ] Yetkili owner/personel numarasıyla uygun saat sorgula; yalnızca yetkili tesislerin döndüğünü doğrula.
- [ ] Yetkisiz ve kaldırılmış personel numarasıyla komut gönder; hiçbir tesis/veri açığa çıkmadan reddedildiğini doğrula.
- [ ] Eksik, belirsiz ve hatalı tarih/saat içeren mesajlar gönder; asistanın netleştirme istediğini doğrula.
- [ ] Türkçe gün adı, göreli tarih ve farklı saat yazımlarını test et; nihai özette kesin `yyyy-MM-dd` ve `HH:mm` değerlerini doğrula.
- [ ] Rezervasyon özetine onay vermeden konuşmayı kapat; DB kaydı oluşmadığını doğrula.
- [ ] Onay ver; web paneli takviminde tek manuel rezervasyonun anında göründüğünü doğrula.
- [ ] Aynı mesaj/webhook tekrarını gönder; duplicate rezervasyon oluşmadığını doğrula.
- [ ] Dolu slotu rezerve etmeyi dene; kullanıcı dostu çakışma mesajı ve alternatiflerin gösterildiğini doğrula.
- [ ] Owner'ın yetkili olmadığı tesisi mesaj metninde zorla; servis/RLS tarafından reddedildiğini doğrula.
- [ ] WhatsApp API timeout ve yeniden deneme senaryosunda çift cevap/çift rezervasyon oluşmadığını doğrula.
- [ ] Web paneli ve WhatsApp'tan oluşturulan aynı tür rezervasyonların kaynak, fiyat ve audit alanlarını karşılaştır.
- [ ] Audit/log kayıtlarında açık mesaj içeriği, telefon, müşteri notu veya token bulunmadığını kontrol et.

### Kabul kriterleri

- [ ] Asistan yalnızca yetkili personel adına işlem yapabilir.
- [ ] Kullanıcı onayı olmadan rezervasyon veya iptal gerçekleşmez.
- [ ] Web paneli ve WhatsApp işlemleri aynı servis/DB kurallarını kullanır.

---

## 4. Paralel Kalite Backlog'u

Bu işler ilgili ürün fazıyla birlikte yürütülür; ayrı bir “sonradan güvenlik” fazına
ertelenmez.

### Test

- [ ] Her yeni saf fiyat/tarih/istatistik fonksiyonuna unit test yaz.
- [ ] Her migration için rol ve kötüye kullanım senaryolu pgTAP testi ekle.
- [ ] Customer → owner → admin kritik akışı için E2E yaklaşımını yeniden değerlendir.
- [ ] Tekrarlayan rezervasyon, hold ve webhook yarış durumlarını test et.
- [ ] Europe/Istanbul gün sınırı ve yıl geçişi testlerini koru.

### UX ve erişilebilirlik

- [ ] Her yeni listede skeleton, empty, error ve retry durumu sağla.
- [ ] Her mutasyonda loading kilidi, toast ve tekrar gönderim koruması sağla.
- [ ] Dialog/Sheet odak yönetimi ve klavye kullanımını test et.
- [ ] Renk dışı durum göstergeleri ve erişilebilir form hata mesajları kullan.
- [ ] Mobilde owner'ın en sık aksiyonlarını başparmak erişiminde tut.

### Performans ve gözlemlenebilirlik

- [ ] Liste sorgularını sayfala; gereksiz geniş select kullanma.
- [ ] Yeni indexleri gerçek sorgu planıyla doğrula.
- [ ] PII içermeyen hata/event isimleri belirle.
- [ ] Takvim yükleme, manuel rezervasyon süresi ve arama dönüşümünü ölç.
- [ ] Kritik Edge Function ve webhook hataları için alarm oluştur.

### Güvenlik

- [ ] İstemciden gelen rol, fiyat, kaynak, komisyon ve durum alanlarına güvenme.
- [ ] Her yeni tabloda RLS, index ve gerekli `updated_at` trigger'ını aynı migration'a koy.
- [ ] Provider secret ve service-role anahtarlarını yalnızca sunucu secret store'da tut.
- [ ] Loglara telefon, e-posta, not veya provider payload'ı yazma.
- [ ] Export, hesap silme ve finansal aksiyonlarda yeniden kimlik doğrulamayı değerlendir.

## 5. Önerilen Teslim Sırası

| Paket | Fazlar | Çıktı | Sonraki kapı |
|---|---|---|---|
| Paket A | 13–14 | Güvenilir geliştirme ortamı ve rezervasyon kaynağı | Takvim özellikleri başlanabilir |
| Paket B | 15–16 | Tekrar serisi ve hızlı müşteri akışı | Owner günlük ana takvim olarak kullanabilir |
| Paket C | 17–18 | Personel ve tahsilat operasyonu | İlk tesis onboarding'i yapılabilir |
| Paket D | 19 | Güvenilirlik ve satış modu | Anında rezervasyon güvenle sınırlandırılır |
| Paket E | 20 | Channel Manager temeli | Resmi sağlayıcı pilotu yapılabilir |
| Paket F | 21–22 | Boş saat satışı ve gerçek müsaitlik araması | Talep büyütme testi yapılabilir |
| Paket G | 23–25 | Bildirim, admin ölçümü ve KVKK | Kontrollü bölge pilotu ölçeklenebilir |
| Paket H | 26 | Tam ödeme ve hak ediş | Hukuk/mali/provider kapısından sonra |
| Paket I | 27 | WhatsApp asistanı | Çekirdek takvim kanıtlandıktan sonra |

## 6. İlk Uygulama Sprinti

İlk uygulama sprintinde yalnızca aşağıdaki işler alınır:

- [ ] Supabase geliştirme bağlantısını ve DB test komutunu tamamla.
- [ ] Mevcut customer/owner/admin akışını gerçek veriyle doğrula.
- [ ] `reservation_source` migration ve RLS kurallarını yaz.
- [ ] Customer, manuel ve blok rezervasyon kaynaklarını otomatik ata.
- [ ] Owner takvimi ve rezervasyon listesinde kaynak rozetlerini göster.
- [ ] Kaynak bazlı owner istatistiği ekle.
- [ ] Migration, servis ve istatistik testlerini yaz.
- [ ] `typecheck`, `lint`, `build`, unit ve DB testlerini temizle.

Sprint tamamlandığında Faz 15'teki tekrarlayan rezervasyon veri modeli ele alınır.
