# Türkçe auth e-posta şablonları

Supabase Auth'un gönderdiği e-postalar için markalı (zümrüt), Türkçe HTML şablonları.

| Dosya | E-posta | Konu |
|---|---|---|
| `confirmation.html` | Kayıt doğrulama | SahaSepeti — Hesabınızı doğrulayın |
| `recovery.html` | Şifre sıfırlama | SahaSepeti — Şifre sıfırlama |
| `magic-link.html` | Sihirli bağlantı | SahaSepeti — Giriş bağlantınız |
| `email-change.html` | E-posta değişikliği | SahaSepeti — E-posta değişikliği onayı |

Go template değişkenleri: `{{ .ConfirmationURL }}`, `{{ .NewEmail }}` (Supabase enjekte eder).

## ⚠️ Aktivasyon (şu an engelli)
Bu proje **Supabase ücretsiz planında + varsayılan e-posta sağlayıcısında** olduğundan
özel şablon uygulanamıyor (`400: Email template modification is not available for free
tier projects using the default email provider`). Aktive etmek için:

1. **Özel SMTP tanımla** (Dashboard → Authentication → Emails → SMTP Settings) — ör. Resend/SMTP.
   Bu, rezervasyon bildirimi e-postasıyla aynı sağlayıcı gereksinimidir (bkz. `functions/notify-reservation`).
   veya **projeyi ücretli plana yükselt.**
2. Sonra şablonlar iki yolla uygulanır:
   - **Dashboard**: Authentication → Emails → her şablonu ilgili HTML ile değiştir.
   - **Management API** (token varsa): `PATCH /v1/projects/<ref>/config/auth`
     — `mailer_subjects_*` + `mailer_templates_*_content` alanlarına bu dosyaların içeriği.

SMTP tanımlandığı an bu şablonlar hazır; kopyala-yapıştır ya da API ile tek seferde uygulanır.
