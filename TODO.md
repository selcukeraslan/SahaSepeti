# SahaSepeti — Current Work

## CURRENT — Faz 10/13 doğrulama kapısı

- [ ] Customer kayıt, profil trigger'ı ve rolü tarayıcıda doğrula.
- [ ] Owner tesis, saha, çalışma saati ve fiyat ekleyip onaya gönderir.
- [ ] Admin tesisi onaylar ve public listede görünür.
- [ ] Customer slot seçip rezervasyon oluşturur.
- [ ] Aynı slotta ikinci rezervasyon kullanıcı dostu çakışma mesajı gösterir.
- [ ] Owner rezervasyonu onaylar, tamamlar ve no-show işaretler.
- [ ] Customer uygun rezervasyonu iptal eder.
- [ ] Tamamlanan rezervasyona yorum yazılır ve public maskeli görünür.
- [ ] Customer, owner ve admin route erişimleri gerçek oturumlarla kontrol edilir.
- [ ] Owner başka owner'ın tesis/verisini göremez.
- [ ] 390px mobil ve 1440px masaüstü kontrol edilir.
- [ ] Browser console ve Network sekmesinde beklenmeyen hata kalmaz.
- [ ] `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` kanıtlanır.

## Ürün sınırları

- Gerçek ödeme ertelenmiştir; payments placeholder kalır.
- E-posta domain aktivasyonu, mobil uygulama ve çoklu dil ertelenmiştir.
- Sosyal ağ, oyuncu eşleştirme, sohbet ve ileri fikirler mevcut görev değildir.

## Tamamlananlar

Faz 0–9, 14, 15 ve 16 tamamlandı. Faz 10 ve 13 kod olarak büyük ölçüde hazırdır; manuel tarayıcı/regresyon kanıtı beklemektedir.

## Çalışma protokolü

1. Mevcut deseni incele; yeni mimari icat etme.
2. DB değişikliğinde yeni migration + RLS + tip senkronu yap.
3. Supabase çağrılarını feature service katmanında tut.
4. UI Türkçe, kod ve DB İngilizce olsun.
5. Değişiklik sonrası typecheck, lint, test ve build çalıştır.
6. Yalnızca doğrulanan maddeleri tamamlandı olarak işaretle.
