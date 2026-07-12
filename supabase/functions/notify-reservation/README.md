# notify-reservation — Rezervasyon bildirim e-postası

Yeni bir rezervasyon **onay bekliyor (pending)** olarak oluşturulduğunda, tesis
sahibine Resend üzerinden e-posta gönderir. Supabase Database Webhook ile
`reservations` tablosunun INSERT olayında tetiklenir.

```
Müşteri rezervasyon yapar (status: pending)
   └─▶ Database Webhook (reservations · INSERT)
        └─▶ notify-reservation (bu fonksiyon)
             ├─ venue.owner_id → auth.users → sahibin e-postası
             └─▶ Resend → tesis sahibine e-posta
```

## Gereksinimler
- [Supabase CLI](https://supabase.com/docs/guides/cli) kurulu ve projeye bağlı (`supabase link`)
- [Resend](https://resend.com) hesabı + API anahtarı

## 1) Resend hazırlığı
1. resend.com'da ücretsiz hesap aç, **API Keys → Create** ile bir anahtar oluştur (`re_...`).
2. Gönderen adres:
   - **Test için**: `onboarding@resend.dev` kullanılabilir — ancak Resend yalnızca
     **kendi hesap e-postana** göndermene izin verir (üretim için yetersiz).
   - **Üretim için**: Resend'de bir **alan adı doğrula** (DNS kayıtları) ve
     `bildirim@senindomainin.com` gibi bir adres kullan.

## 2) Secret'ları ayarla
```bash
supabase secrets set RESEND_API_KEY="re_xxxxxxxx"
supabase secrets set NOTIFY_FROM_EMAIL="SahaSepeti <bildirim@senindomainin.com>"
supabase secrets set APP_URL="https://senin-siten.com"        # e-postadaki panel linki için
supabase secrets set NOTIFY_WEBHOOK_SECRET="uzun-rastgele-bir-deger"   # opsiyonel ek güvenlik
```
`SUPABASE_URL` ve `SUPABASE_SERVICE_ROLE_KEY` Edge Function ortamına **otomatik**
enjekte edilir; ayrıca ayarlamana gerek yok.

## 3) Fonksiyonu deploy et
```bash
supabase functions deploy notify-reservation
```

## 4) Database Webhook oluştur
Supabase Dashboard → **Database → Webhooks → Create a new hook**:
- **Name**: `notify-reservation`
- **Table**: `public.reservations`
- **Events**: yalnızca **Insert**
- **Type**: **Supabase Edge Functions** → `notify-reservation`
  (bu tür, `Authorization` başlığını otomatik ekler; JWT doğrulaması sorunsuz geçer)
- (Opsiyonel) **HTTP Headers**: `x-webhook-secret: <NOTIFY_WEBHOOK_SECRET ile aynı değer>`

> Alternatif: "HTTP Request" türü seçersen URL
> `https://<PROJE-REF>.supabase.co/functions/v1/notify-reservation` olur ve
> `Authorization: Bearer <SERVICE_ROLE_KEY>` başlığını elle eklemen gerekir.

## 5) Test
1. Uygulamada müşteri olarak bir rezervasyon oluştur (durum `pending` olur).
2. İlgili tesisin sahibinin e-postasına bildirim düşmeli.
3. Sorun olursa logları izle:
   ```bash
   supabase functions logs notify-reservation
   ```

## Davranış notları
- Fonksiyon yalnızca `status === 'pending'` kayıtlarda e-posta gönderir; diğer
  durumları sessizce atlar (200 döner).
- Tesis/sahip/e-posta bulunamazsa webhook'un gereksiz yere yeniden denememesi için
  `200` döner ve nedeni loglar (kişisel veri loglanmaz).
- E-posta gövdesinde müşterinin e-postası/telefonu **yer almaz** (KVKK).
- Gönderim rezervasyon oluşturma işlemini **bloklamaz** (webhook asenkron çalışır);
  e-posta başarısız olsa bile rezervasyon oluşur.
