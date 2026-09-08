# SahaSepeti — Ürün Stratejisi

## Odak

SahaSepeti, Türkiye'deki spor tesisi ve saha rezervasyon platformudur. Müşteri gerçek müsaitliği görür ve rezervasyon oluşturur; tesis sahibi tesisini, sahalarını, fiyatlarını ve takvimini yönetir.

## Temel değer önerisi

Takvimi ücretsiz kullan; boş saatlerini tam ödemeli müşteriye sat. Tesis yazılımı ücretsizdir ve manuel/tesis kaynaklı rezervasyonlardan platform komisyonu alınmaz.

## Ürün ilkeleri

1. Takvim doğruluğu özellik sayısından önemlidir.
2. Tesis sahibi için takvim ve operasyon akışı hızlı olmalıdır.
3. Müşteri için boş görünen saat gerçekten boş olmalıdır.
4. Önce seçilen şehir ve ilçelerde yoğunluk sağlanır.
5. Ürün sosyal ağ, sohbet, oyuncu eşleştirme veya içerik platformuna dönüşmez.

## Rezervasyon ve envanter

Her tesisin tek bir ana takvimi vardır. SahaSepeti ana takvim olduğunda anında rezervasyon açılabilir. Dış sağlayıcı entegrasyonları ileride channel manager üzerinden ele alınır; ekran kazıma, kullanıcı şifresi saklama ve uygulama otomasyonu yapılmaz.

## Ödeme

Gerçek ödeme, webhook, iade ve hak ediş akışı MVP kapsamı dışındadır. `payments` placeholder olarak kalır. Ödeme kararları hukuki ve mali değerlendirme olmadan kesinleştirilmez.

## Operasyonel sınırlar

- UI Türkçe, kod ve veritabanı İngilizce.
- Saat dilimi Europe/Istanbul.
- RLS ana güvenlik sınırıdır.
- Kişisel veri minimum tutulur; loglara kişisel veri yazılmaz.
- Mobil web, erişilebilirlik ve loading/empty/error/success durumları korunur.
