const tryFormatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  maximumFractionDigits: 0,
})

/** "2026-07-12" → "12.07.2026" (saat dilimi tuzağı olmadan) */
function formatDate(ymd: string): string {
  const [year, month, day] = ymd.split('-')
  return `${day}.${month}.${year}`
}

/** Kullanıcı/tesis kaynaklı metinlerin e-posta HTML yapısını bozmasını önler. */
function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character] ?? character,
  )
}

export function renderEmail(input: {
  ownerName: string
  venueName: string
  courtName: string
  date: string
  start: string
  end: string
  price: number
  panelUrl: string
}): string {
  const priceText = tryFormatter.format(input.price)
  const ownerName = escapeHtml(input.ownerName)
  const venueName = escapeHtml(input.venueName)
  const courtName = escapeHtml(input.courtName)
  const panelUrl = escapeHtml(input.panelUrl)
  const cta = input.panelUrl
    ? `<a href="${panelUrl}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:12px">Rezervasyonu Görüntüle</a>`
    : ''
  return `<!doctype html>
<html lang="tr"><body style="margin:0;background:#f1f5f4;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a">
  <div style="max-width:520px;margin:0 auto;padding:24px">
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(15,23,42,.06)">
      <div style="background:#059669;padding:20px 24px">
        <span style="color:#ffffff;font-size:18px;font-weight:700">SahaSepeti</span>
      </div>
      <div style="padding:24px">
        <h1 style="margin:0 0 4px;font-size:18px">Yeni rezervasyon onayı bekliyor</h1>
        <p style="margin:0 0 20px;color:#475569;font-size:14px">
          Merhaba ${ownerName}, <strong>${venueName}</strong> için yeni bir rezervasyon talebi var.
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:8px 0;color:#64748b">Saha</td><td style="padding:8px 0;text-align:right;font-weight:600">${courtName}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Tarih</td><td style="padding:8px 0;text-align:right;font-weight:600">${formatDate(input.date)}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Saat</td><td style="padding:8px 0;text-align:right;font-weight:600">${input.start} – ${input.end}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Tutar</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#059669">${priceText}</td></tr>
        </table>
        <div style="margin-top:24px">${cta}</div>
        <p style="margin:24px 0 0;color:#94a3b8;font-size:12px">
          Bu rezervasyon onayınızı bekliyor. Panelinizden onaylayabilir veya reddedebilirsiniz.
        </p>
      </div>
    </div>
  </div>
</body></html>`
}
