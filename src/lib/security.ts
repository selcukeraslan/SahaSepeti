/**
 * JSON-LD verisini bir <script> etiketi içinde güvenle taşır.
 * HTML ayrıştırıcısının kullanıcı verisindeki `</script>` ile etiketi erken
 * kapatmasını önlemek için riskli karakterleri Unicode kaçışına çevirir.
 */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}
