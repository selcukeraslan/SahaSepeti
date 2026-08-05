import { SITE_DESCRIPTION, SITE_NAME } from '@/config/site'

interface SeoProps {
  /** Sayfa başlığı — "— SahaSepeti" otomatik eklenir (zaten içeriyorsa eklenmez) */
  title: string
  description?: string
  /** Paylaşım görseli (mutlak URL); yoksa og:image üretilmez */
  image?: string | null
  /** Kanonik yol (ör. "/tesis/x"); verilmezse mevcut URL kullanılır */
  canonicalPath?: string
  type?: 'website' | 'article'
  /** Arama motorlarına indeksleme (panel/özel sayfalar için false) */
  index?: boolean
}

/**
 * Sayfa başlık + meta etiketlerini ayarlar. React 19 `<title>`/`<meta>`/`<link>`
 * öğelerini otomatik olarak <head>'e taşır — ekstra kütüphane gerekmez.
 * Aynı anda tek route mount olduğundan çakışma olmaz.
 */
export function Seo({
  title,
  description = SITE_DESCRIPTION,
  image,
  canonicalPath,
  type = 'website',
  index = true,
}: SeoProps) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const url = canonicalPath
    ? `${origin}${canonicalPath}`
    : typeof window !== 'undefined'
      ? window.location.origin + window.location.pathname
      : ''

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {!index && <meta name="robots" content="noindex, nofollow" />}
      {url && <link rel="canonical" href={url} />}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      {url && <meta property="og:url" content={url} />}
      {image && <meta property="og:image" content={image} />}

      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
    </>
  )
}
