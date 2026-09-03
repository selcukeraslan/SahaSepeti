# SahaSepeti Ürün ve Büyüme Stratejisi

Son güncelleme: 2026-08-05

## 1. Stratejik Odak

SahaSepeti bir sosyal ağ, takım kurma uygulaması veya spor içerik platformu değildir.
Temel ürün, saatlik spor sahalarının güvenilir biçimde bulunmasını, tam ödeme ile
anında rezerve edilmesini ve tesislerin rezervasyon takvimlerini tek yerden
yönetmesini sağlayan bir pazaryeridir.

Ana değer önerisi:

> Takvimi ücretsiz kullan. Boş saatlerini biz tam ödemeli müşteriye satalım.
> Yalnızca sana satış getirdiğimizde komisyon öde.

Müşteri vaadi:

> Boş görünen saat gerçekten boştur. Ödemeni yap, rezervasyonun anında kesinleşsin.

Tesis vaadi:

> Aylık ücret ve taahhüt olmadan bütün rezervasyonlarını yönet. SahaSepeti sana
> yeni ve ödemeli rezervasyon getirdiğinde komisyon öde.

## 2. Temel İlkeler

1. **Takvim doğruluğu büyüklükten önemlidir.** Az sayıda fakat gerçekten aktif
   ve güncel tesis, çok sayıda pasif veya doğrulanmamış tesisten değerlidir.
2. **Tesis yazılımı ücretsizdir.** Aylık, yıllık veya kurulum ücreti alınmaz.
3. **Gelir başarıya bağlıdır.** Komisyon yalnızca SahaSepeti'nin getirdiği ve
   tam ödemesi platformdan geçen, gerçekleşmiş rezervasyonlardan alınır.
4. **Manuel rezervasyon ücretsizdir.** Telefon, WhatsApp veya tesisin kendi
   müşterilerinden gelen ve owner tarafından takvime girilen kayıtlardan platform
   komisyonu alınmaz.
5. **Anında rezervasyon güven gerektirir.** Ana takvim veya güvenilir API
   entegrasyonu bulunmayan tesislerde anında rezervasyon ve tam ödeme açılmaz.
6. **Önce yerel yoğunluk sağlanır.** Türkiye geneline dağılmadan önce seçilen
   şehir ve ilçelerde yüksek aktif tesis oranına ulaşılır.
7. **Ürün sade kalır.** Sosyal akış, oyuncu profili, takım kurma, sohbet ve video
   paylaşımı ana ürün kapsamına alınmaz.

## 3. Rekabet Konumlandırması

Olleyy ve SporPin gibi ürünler saha listeleme, online rezervasyon ve tesis yönetimi
sunmaktadır. SahaSepeti rakiplerden daha fazla özellik ekleyerek değil, daha doğru
müsaitlik ve daha iyi ekonomik teşvik sağlayarak ayrışacaktır.

Rakiplere karşı temel farklar:

- Sabit ücret yoktur.
- Kurulum ve veri taşıma desteği ücretsizdir.
- Manuel/tesis kaynaklı rezervasyonlardan komisyon alınmaz.
- Platform kaynaklı rezervasyonlarda tam ödeme alınır.
- Boş saatler otomatik olarak satış fırsatına dönüştürülür.
- Takvim güncelliği ölçülür ve güvenilir olmayan tesislerde satış durdurulur.
- Ürün yalnızca saha rezervasyonuna odaklanır; eğitmen, spor üyeliği veya sosyal ağ
  gibi farklı satın alma davranışları aynı ürüne eklenmez.

## 4. Kazandıran Takvim

SahaSepeti takvimi yalnızca rezervasyon kayıt ekranı değil, tesisin boş kapasitesini
gelire dönüştüren satış motorudur.

### Ücretsiz tesis araçları

- Sınırsız saha ve rezervasyon kaydı
- Hızlı manuel rezervasyon
- Tekrarlayan haftalık rezervasyon/abone
- Saat bloklama ve bakım kaydı
- Müşteri geçmişi
- Tahsilat ve alacak takibi
- No-show ve kara liste
- Personel hesapları ve yetkileri
- Günlük, haftalık ve aylık doluluk/ciro raporları
- Verileri dışa aktarma

### Hız hedefi

Telefonla alınan bir rezervasyon, görüşme bitmeden takvime girilebilmelidir.
Hedef akış:

1. Owner boş saate dokunur.
2. Müşteri adı veya telefonun son dört hanesini girer.
3. Daha önceki müşteri otomatik bulunur.
4. Tek dokunuşla kaydeder veya haftalık tekrara dönüştürür.

Hedef işlem süresi 5–10 saniyedir.

## 5. Boş Saat Satış Motoru

Takvimi güncel tutmanın ödülü daha fazla satış olmalıdır. Sistem yaklaşan boş
saatleri tespit eder ve owner'ın önceden belirlediği kurallarla satışa çıkarır.

Örnek kurallar:

- Maça 6 saat kalmış ve slot boşsa yüzde 10 indirim uygula.
- Maça 2 saat kalmış ve slot boşsa yüzde 15 indirim uygula.
- Hafta sonu 19:00–22:00 arasında otomatik indirim uygulama.
- Boş saati arama sonuçlarında ve favori bildirimlerinde öne çıkar.

İlk sürümde kampanya owner onayıyla başlatılabilir. Yeterli veri ve güven
oluştuktan sonra kurala bağlı otomatik fiyatlandırmaya geçilebilir.

## 6. Takvim Bütünlüğü ve Çakışma Önleme

Başka platformdaki veya telefonla alınan rezervasyon görülmeden çift rezervasyonu
kesin olarak engellemek mümkün değildir. Bu nedenle her tesisin yalnızca bir ana
takvimi bulunmalıdır.

### Envanter sağlayıcıları

Her tesis için bir `inventory_provider` tanımlanır:

- `sahasepeti`: Tesisin ana takvimi SahaSepeti'dir.
- `sporpin`: SporPin ana takvimdir; SahaSepeti satış kanalıdır.
- `olleyy`: Olleyy ana takvimdir; SahaSepeti satış kanalıdır.
- İleride eklenecek diğer sağlayıcılar.

Bir tesis aynı anda birden fazla bağımsız ana takvim kullanamaz. Dış sistem ana
takvimse SahaSepeti müsaitliği o sistemden okur, slotu o sistemde kilitler ve
rezervasyonu o sisteme yazar.

### Tesis seviyeleri

1. **SahaSepeti ana takvim:** Anında rezervasyon ve tam ödeme açıktır.
2. **API ile entegre takvim:** Anında rezervasyon ve tam ödeme açıktır.
3. **Manuel senkronizasyon:** Anında rezervasyon ve tam ödeme kapalıdır.
4. **Güvenilir olmayan tesis:** Satış kapatılır; sorun çözülmeden tekrar açılmaz.

### Güvenli rezervasyon akışı

1. Kullanıcı bir slot seçer.
2. Ana takvimde yaklaşık 5 dakikalık geçici kilit oluşturulur.
3. Kilit alınamazsa kullanıcıya saatin az önce dolduğu bildirilir.
4. Kilit başarılıysa tam ödeme başlatılır.
5. Ödeme başarılıysa kilit kalıcı rezervasyona çevrilir.
6. Ödeme başarısızsa kilit kaldırılır.
7. Ödeme alınmasına rağmen rezervasyon kesinleşemezse otomatik iade başlatılır.

### Entegrasyon güvenliği

- Webhook'lar idempotent işlenir.
- Başarısız olaylar outbox/retry mekanizmasıyla yeniden denenir.
- Periyodik tam takvim mutabakatı yapılır.
- Son başarılı senkronizasyon kabul edilen süreyi aşarsa tesis satışa kapatılır.
- Sağlayıcı API'si cevap vermiyorsa yeni ödeme başlatılmaz (`fail closed`).
- ICS/Google Calendar yalnızca yardımcı görünürlük için kullanılabilir; atomik
  slot kilidi sağlamadığı için anında rezervasyonun kaynağı olamaz.

### Genel kanal yöneticisi mimarisi

Entegrasyonlar rezervasyon motoruna doğrudan gömülmez:

```text
SahaSepeti Rezervasyon Motoru
              |
              v
        Channel Manager
         |- NativeAdapter
         |- SporPinAdapter
         |- OlleyyAdapter
         `- FutureAdapter
```

Her sağlayıcı en az şu yetenekleri sunmalıdır:

- Müsaitlik okuma
- Geçici slot kilidi oluşturma
- Rezervasyonu kesinleştirme
- Rezervasyonu iptal etme
- Değişiklikleri webhook ile bildirme
- Mutabakat sorgusu

Her dış rezervasyonda kaynak platform, dış sistem kimlikleri, senkronizasyon
durumu, son senkronizasyon zamanı, ödeme, iade ve hak ediş durumu saklanır.

## 7. Entegrasyon ve Ortaklık Stratejisi

SporPin, Olleyy veya başka bir sağlayıcıyla ortaklık teklifinin mesajı:

> Yönetim sisteminizi değiştirmek istemiyoruz. Siz tesisin ana takvimi olarak
> kalın; SahaSepeti yeni ve tam ödemeli rezervasyon getiren satış kanalı olsun.

Pilot model:

- 3–5 ortak tesis
- Çift yönlü müsaitlik ve rezervasyon API'si
- SahaSepeti kaynaklı rezervasyonlar için kaynak takibi
- Komisyon veya teknoloji payı
- API çalışma süresi ve hata sorumluluğu
- Veri sahipliği ve müşteri devşirmeme hükümleri
- Pilot sonunda çakışma, rezervasyon ve gelir raporu

Ortaklık kabul edilmezse ilgili sağlayıcıya bağımlı bir yöntem kullanılmaz;
ekran kazıma, kullanıcı şifresi saklama veya uygulama otomasyonu yapılmaz.
SahaSepeti kendi ana takvimini güçlendirir ve yalnızca onu kullanmayı kabul eden
tesislerde anında rezervasyon açar.

## 8. Ödeme ve Gelir Modeli

Kaporaya dayalı model yerine kullanıcıdan rezervasyon tutarının tamamı alınır.
Para SahaSepeti'nin banka hesabında manuel olarak tutulup dağıtılmaz. Lisanslı bir
pazaryeri ödeme kuruluşu aracılığıyla ödeme alınır, komisyon ayrıştırılır ve tesis
hak edişi otomatik aktarılır.

Temel ödeme durumları:

- Geçici ödeme/slot kilidi
- Ödendi
- İade bekliyor
- İade edildi
- Harcama itirazı
- Hak ediş bekliyor
- Tesise ödendi

Ödeme geliştirmesinden önce şu kararlar yazılı hâle getirilir:

- Ücretsiz iptal süresi
- Geç iptal ve no-show kuralları
- Müşteri iptalinin hangi koşullarda doğrudan sonuçlanacağı, hangi koşullarda owner
  onayına gideceği; owner yanıt süresi ve yanıtsız kalma davranışı
- Tesis kaynaklı iptal yaptırımı
- İade süresi
- Tesis hak ediş tarihi
- Harcama itirazı sorumluluğu
- Fatura ve komisyon faturası akışı
- Ödeme kuruluşu maliyeti sonrası net komisyon

Ödeme oranı, iyzico/PayTR gibi sağlayıcılardan gerçek teklif ve mali müşavir/hukuk
görüşü alınmadan belirlenmez.

## 9. Bypass Riskinin Yönetimi

Kullanıcı tesise fiziksel olarak gittiği için platform dışına çıkma tamamen
engellenemez. Amaç iletişimi imkânsızlaştırmak değil, platformda kalmayı iki taraf
için daha değerli kılmaktır.

- Tesis telefonu rezervasyondan önce gösterilmez.
- Gerekli adres ve iletişim bilgileri ödeme sonrasında gösterilir.
- Kullanıcıya güvenli ödeme, açık iade ve kolay tekrar rezervasyonu sunulur.
- Tesise peşin ödeme, no-show koruması ve otomatik muhasebe sunulur.
- SahaSepeti kaynaklı müşteriyi platform dışına yönlendirmek tesis sözleşmesinde
  yasaklanabilir.
- Tekrarlayan platform dışı yönlendirme güvenilirlik ve sıralama kaybına yol açar.

## 10. Tesis Kazanım Operasyonu

Saha sahibinden mevcut sistemini kendi başına taşıması beklenmez. İlk tesislerde
onboarding yüksek temaslı ve ücretsiz yürütülür:

- Saha, fiyat, çalışma saati ve fotoğrafları SahaSepeti ekibi girer.
- Gelecek rezervasyonlar ve haftalık aboneler aktarılır.
- Personellere kısa eğitim verilir.
- İlk ay doğrudan destek sağlanır.
- Veri dışa aktarma ve taahhütsüz ayrılma garantisi verilir.

Coğrafi büyüme sırası:

```text
1 şehir
  `- 1–2 ilçe
       `- 20–30 aktif ve doğrulanmış tesis
```

Yeni bölgeye geçmeden önce mevcut bölgede yüksek tesis yoğunluğu ve takvim
doğruluğu sağlanır.

## 11. Ürün Yol Haritası

Önerilen geliştirme sırası:

1. Tekrarlayan haftalık rezervasyon
2. Personel hesapları ve yetkileri
3. 5–10 saniyelik hızlı manuel rezervasyon
4. Tahsilat, alacak ve hak ediş görünümü
5. Takvim güncelliği ve tesis güvenilirlik sistemi
6. Genel Channel Manager ve dış sağlayıcı adaptör altyapısı
7. Boş Saat Satış Motoru
8. Tarih-saat bazlı gerçek müsaitlik filtresi
9. Tam ödeme, otomatik komisyon, iade ve hak ediş
10. WhatsApp takvim asistanı
11. İlk ilçede kontrollü tesis kazanım operasyonu

Gerçek ödeme entegrasyonuna geçildiğinde repodaki ödeme entegrasyonunu yasaklayan
mevcut ajan/proje kuralı bilinçli olarak güncellenmeli; ödeme fazı ayrı migration,
güvenlik testleri ve operasyon prosedürleriyle yürütülmelidir.

## 12. Başarı Metrikleri

İndirme ve kayıt sayısı tek başına başarı ölçütü değildir. İzlenecek temel metrikler:

- Aktif ve online rezervasyona açık tesis sayısı
- Seçilen bölgedeki aktif tesis kapsama oranı
- Takvimi son 24 saatte güncel olan tesis oranı
- Gerçekleşen rezervasyon başına çakışma oranı
- Tesis kaynaklı iptal oranı
- Aramadan uygun slot bulma oranı
- Uygun slottan ödemeye dönüşüm oranı
- İlk rezervasyondan ikinci rezervasyona dönüş oranı
- Boş Saat Satış Motoru'nun doldurduğu ek slot sayısı
- Tesis başına platform kaynaklı aylık ek gelir
- Ödeme sonrası iade ve harcama itirazı oranı
- Senkronizasyon gecikmesi ve entegrasyon hata oranı

Başlangıç kalite hedefleri:

- Takvim güncelliği: yüzde 95 ve üzeri
- Çift rezervasyon: yüzde 0,1'in altında
- Tesis kaynaklı iptal: yüzde 1'in altında
- Entegrasyon kesildiğinde hatalı satış: sıfır

## 13. Kapsam Dışında Tutulacaklar

İlk büyüme aşamasında aşağıdakiler yapılmaz:

- Sosyal medya akışı
- Takım ve oyuncu profilleri
- Rakip veya eksik oyuncu bulma
- Uygulama içi sohbet
- Video/gol paylaşımı
- Eğitmen pazaryeri
- Spor salonu ve dönemlik üyelik paketleri
- Türkiye geneline kontrolsüz tesis ekleme
- Sürekli indirimle kullanıcı satın alma
- Doğrulanmamış tesisleri katalog büyütmek için yayınlama

## 14. Tek Cümlelik Konumlandırma

> SporPin veya defter yalnızca takvim tutar. SahaSepeti boş saatleri tam ödemeli
> rezervasyona dönüştürür; satış getirmezse tesis hiçbir ücret ödemez.
