# AGENTS.md — AI Kodlama Ajanları İçin Talimatlar

## Başlamadan Önce Oku

1. `CLAUDE.md` — mimari kurallar ve kodlama standartları (bağlayıcıdır).
2. `TODO.md` — faz planı; hangi fazda olduğumuzu buradan anla, faz sırasına uy.

## Bu Repoda Nasıl Çalışılır

- Değişiklikten önce ilgili feature klasörünü ve mevcut benzer örneği incele; **var olan deseni kopyala**, yeni desen icat etme.
- Tipik görev akışı (sıra önemli):
  1. Gerekirse migration (`supabase/migrations/`) + RLS politikası
  2. zod şeması (`features/X/schemas.ts` veya `types.ts`)
  3. Servis fonksiyonu (`features/X/services/x.service.ts`) — Supabase çağrısı sadece burada
  4. Hook (`features/X/hooks/useX.ts`) — TanStack Query sarmalayıcı
  5. Bileşen/sayfa — mantıksız, sadece görünüm
- Yeni UI ihtiyacında önce `src/components/ui`'a bak; yoksa oraya genel bileşen ekle, feature içinde özelini yaz.

## Konvansiyonlar

- Bileşen: `PascalCase.tsx`; hook: `useCamelCase.ts`; servis: `camelCase.service.ts`.
- Import alias: `@/` → `src/`.
- UI metinleri Türkçe; kod, tablolar, değişkenler İngilizce.
- Tarih `yyyy-MM-dd`, saat `HH:mm` string olarak taşınır.

## Supabase Kuralları

- Şema değişikliği = yeni migration dosyası (`NNN_aciklama.sql`, artan sıra). Var olan migration DÜZENLENMEZ.
- Her yeni tabloda: RLS enable + politikalar + `updated_at` trigger + gerekli indexler aynı migration'da.
- Tip senkronu: şema değişince `database.types.ts` güncellenir.

## Doğrulama Beklentisi

Her değişiklik sonrası çalıştır ve sıfır hata bekle:

```bash
npm run typecheck && npm run lint && npm run build
```

Slot üretimi / fiyat hesabı gibi saf mantık değiştiyse `npm test`.

## Commit Tarzı

- Küçük, odaklı commitler; mesaj İngilizce emir kipi: `add court CRUD to owner dashboard`.
- Migration + ilgili kod aynı committe.

## YAPMA Listesi

- ❌ `any` kullanma (`unknown` + daraltma).
- ❌ Bileşen içinde `supabase.from(...)` çağırma veya iş mantığı tekrarı.
- ❌ RLS'siz tablo bırakma / politikayı sonraya erteleme.
- ❌ Gerçek ödeme entegrasyonu ekleme (placeholder kalacak).
- ❌ Fiyatı istemciden alma — her zaman `price_rules`'tan hesapla.
- ❌ MVP kapsamı dışında kütüphane/soyutlama ekleme.
- ❌ Var olan migration dosyasını düzenleme.
