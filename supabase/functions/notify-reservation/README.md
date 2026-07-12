# notify-reservation — Rezervasyon bildirim e-postası

Yeni bir rezervasyon **onay bekliyor (pending)** olarak oluşturulduğunda, tesis
sahibine **Gmail SMTP** üzerinden e-posta gönderir. Supabase Database Webhook ile
`reservations` tablosunun INSERT olayında tetiklenir.

```
Müşteri rezervasyon yapar (status: pending)
   └─▶ Database Webhook (reservations · INSERT)
        └─▶ notify-reservation (bu fonksiyon)
             ├─ venue.owner_id → auth.users → sahibin e-postası
             └─▶ Gmail SMTP → tesis sahibine e-posta
```

> Not: Gmail SMTP, alan adı (domain) gerektirmez ve **herhangi bir alıcıya** gönderir
> (~günde 500 e-posta sınırı). Gönderen adres, kimliği doğrulanan Gmail hesabıdır.
> Üretimde daha profesyonel görünüm için ileride bir alan adı + Resend/SES'e geçilebilir.

## 1) Gmail uygulama şifresi oluştur
1. Google hesabında **2 Adımlı Doğrulama** açık olmalı: <https://myaccount.google.com/security>
2. **Uygulama şifreleri**: <https://myaccount.google.com/apppasswords>
   - Uygulamaya isim ver (ör. "SahaSepeti") → Google 16 haneli bir şifre verir
     (ör. `abcd efgh ijkl mnop`). Bu şifreyi **boşluksuz** kullan.

## 2) Secret'ları ayarla
```bash
supabase secrets set GMAIL_USER="selcukeraslan1998@gmail.com"
supabase secrets set GMAIL_APP_PASSWORD="abcdefghijklmnop"     # boşluksuz 16 hane
supabase secrets set NOTIFY_FROM_NAME="SahaSepeti"             # opsiyonel
supabase secrets set APP_URL="https://senin-siten.vercel.app"  # e-postadaki panel linki
```
`SUPABASE_URL` ve `SUPABASE_SERVICE_ROLE_KEY` otomatik enjekte edilir.

## 3) Deploy et
```bash
supabase functions deploy notify-reservation --project-ref <PROJE_REF>
```

## 4) Database Webhook (yalnızca ilk kurulumda)
Dashboard → **Database → Webhooks → Create a new hook**:
- **Table**: `public.reservations` · **Events**: yalnızca **Insert**
- **Type**: **Supabase Edge Functions** → `notify-reservation` (POST)

## 5) Test
Müşteri olarak bir rezervasyon oluştur → ilgili tesisin sahibine mail düşmeli.

## Davranış notları
- Yalnızca `status === 'pending'` kayıtlarda gönderir; diğerlerini atlar (200).
- Tesis/sahip/e-posta bulunamazsa 200 döner ve nedeni loglar (kişisel veri loglanmaz).
- E-posta gövdesinde müşterinin e-postası/telefonu **yer almaz** (KVKK).
- Webhook asenkrondur; e-posta başarısız olsa bile rezervasyon oluşur.
