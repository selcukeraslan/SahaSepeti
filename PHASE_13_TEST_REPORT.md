# Faz 13 Regresyon Test Kaydı

Test tarihi: 2026-09-03  
Ortam: Geliştirme Supabase projesi  
Test komutu: `node scripts/phase13-smoke.mjs --write`

## Otomatik API/RLS smoke sonuçları

| Senaryo | Sonuç | Not |
|---|---|---|
| Customer demo hesabı ve profil rolü | Geçti | Rol `customer` |
| Owner demo hesabı ve profil rolü | Geçti | Rol `venue_owner` |
| Admin demo hesabı ve profil rolü | Geçti | Rol `admin` |
| Owner tesis, saha, çalışma saati ve fiyat oluşturur | Geçti | Benzersiz `PHASE13-E2E-*` verisi kullanıldı |
| Customer draft tesisi göremez | Geçti | RLS sonucu 0 kayıt |
| Owner tesisi onaya gönderir | Geçti | Admin pending kaydı görebildi |
| Admin tesisi onaylar | Geçti | Tesis anonim public sorguda görünür oldu |
| Customer rezervasyon oluşturur | Geçti | Durum `pending`, fiyat DB tarafından `1375` hesaplandı |
| Aynı slotta ikinci rezervasyon | Geçti | PostgreSQL `23P01` ile engellendi; servis mesaj eşlemesi unit test ile doğrulandı |
| Owner rezervasyonu onaylar | Geçti | `pending → confirmed` |
| Customer gelecekteki rezervasyonu iptal eder | Geçti | Durum ve `cancelled_at` güncellendi |
| Owner başlamış rezervasyonu no-show işaretler | Geçti | Test kaydı admin ile kontrollü biçimde geçmişe alındı |
| Owner rezervasyonu tamamlar | Geçti | `confirmed → completed` |
| Customer tamamlanan rezervasyona yorum yazar | Geçti | Yorum anonim, maskeli public RPC'de görüntülendi |
| Yetkisiz anonim kullanıcı rezervasyonları okuyamaz | Geçti | RLS sonucu 0 kayıt |
| Owner başka kullanıcıya devredilen tesisi değiştiremez | Geçti | RLS sonucu 0 kayıt |
| Test verisi temizliği | Geçti | Test tesisi ve cascade ilişkileri silindi |

## Açık manuel kontroller

- Yeni bir customer'ın kayıt ekranından oluşturulması ve profil trigger'ının tarayıcı akışında doğrulanması.
- Customer, owner ve admin route yönlendirmelerinin gerçek tarayıcı oturumlarıyla kontrol edilmesi.
- Çift rezervasyon hata toast'ının tarayıcıdaki görsel sunumu.
- Akışın 390 px mobil ve 1440 px masaüstü görünümde tamamlanması.
- Browser console ve Network sekmesinde beklenmeyen hata bulunmadığının doğrulanması.
- Refactor öncesi ve sonrası temel görsel düzenin tarayıcıda karşılaştırılması.

## Manuel testte bulunan ve düzeltilen regresyonlar

| Bulgu | Düzenleme | Yeniden test durumu |
|---|---|---|
| Owner, customer'a özel `/rezervasyonlarim` ve `/favorilerim` rotalarına erişebiliyordu | İki rota `customer` rol kontrolü arkasına alındı | Manuel yeniden test bekliyor |
| Hesap kimliği değiştiğinde önceki kullanıcıya ait query cache kalabiliyordu | Aktif kullanıcı ID'si değişince tüm kullanıcı sorgu cache'i temizleniyor | Manuel yeniden test bekliyor |
| Gelecekteki rezervasyonda `Tamamlandı` genel bir hata veriyordu | Aksiyonlar İstanbul tarih/saatine göre pasifleştirildi ve açıklama eklendi; DB hatası Türkçe mesaja eşlendi | Manuel yeniden test bekliyor |

## Veri temizliği

Yazmalı smoke testi her çalışmada benzersiz `PHASE13-E2E-*` tesisi oluşturur. Test sonunda admin oturumuyla tesisi siler; venue ilişkilerindeki saha, çalışma saati, fiyat, rezervasyon ve yorum kayıtları cascade ile temizlenir. Temizlik başarısız olursa komut hata koduyla kapanır ve test tesisinin UUID'sini çıktıda gösterir.

## Komutlar

- Salt-okunur bağlantı/rol kontrolü: `npm run test:phase13`
- Yazmalı ve kendini temizleyen akış: `node scripts/phase13-smoke.mjs --write`
- Kod doğrulama: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`

## Son otomatik doğrulama

2026-09-03 tarihinde:

- `npm run test:phase13`: geçti — 3 demo rolü ve public seed tesisi doğrulandı.
- `node scripts/phase13-smoke.mjs --write`: geçti — 14 yazmalı API/RLS senaryosu ve veri temizliği başarılı.
- `npm run typecheck`: geçti — sıfır TypeScript hatası.
- `npm run lint`: geçti — sıfır lint hatası.
- `npm test`: geçti — 11 test dosyası, 56 test.
- `npm run build`: geçti — production build başarıyla üretildi.
