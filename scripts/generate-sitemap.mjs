/**
 * Build öncesi sitemap.xml üretir. Onaylı tesis sayfalarını Supabase'den çeker;
 * env/erişim yoksa yalnızca statik rotalarla devam eder (build'i asla bozmaz).
 *
 * Ortam değişkenleri (Vercel'de process.env, yerelde .env):
 *   VITE_SITE_URL          — mutlak site adresi (ör. https://sahasepeti.com)
 *   VITE_SUPABASE_URL      — tesisleri çekmek için
 *   VITE_SUPABASE_ANON_KEY / VITE_SUPABASE_PUBLISHABLE_KEY
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

/** .env dosyasını basitçe ayrıştır (process.env öncelikli). */
function loadEnv() {
  const env = { ...process.env }
  if (existsSync('.env')) {
    for (const line of readFileSync('.env', 'utf8').split('\n')) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (match && !env[match[1]]) {
        env[match[1]] = match[2].replace(/^["']|["']$/g, '')
      }
    }
  }
  return env
}

const env = loadEnv()
const SITE_URL = (env.VITE_SITE_URL || 'https://sahasepeti.vercel.app').replace(/\/$/, '')
if (!env.VITE_SITE_URL) {
  console.warn('[sitemap] VITE_SITE_URL tanımlı değil — varsayılan kullanılıyor:', SITE_URL)
}

const staticPaths = ['/', '/tesisler', '/hakkimizda', '/iletisim']

async function fetchVenueSlugs() {
  const url = env.VITE_SUPABASE_URL
  const key = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) {
    console.warn('[sitemap] Supabase env yok — yalnızca statik rotalar yazılıyor.')
    return []
  }
  try {
    const res = await fetch(
      `${url}/rest/v1/venues?select=slug,updated_at&status=eq.approved&order=updated_at.desc`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (error) {
    console.warn('[sitemap] Tesisler çekilemedi:', error.message, '— statik rotalarla devam.')
    return []
  }
}

function urlEntry(loc, lastmod) {
  return `  <url>\n    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod.slice(0, 10)}</lastmod>` : ''}\n  </url>`
}

const venues = await fetchVenueSlugs()
const entries = [
  ...staticPaths.map((path) => urlEntry(SITE_URL + path)),
  ...venues.map((venue) => urlEntry(`${SITE_URL}/tesis/${venue.slug}`, venue.updated_at)),
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`

writeFileSync('public/sitemap.xml', xml)
console.log(`[sitemap] ${entries.length} URL yazıldı (public/sitemap.xml) — ${venues.length} tesis.`)
