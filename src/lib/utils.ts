/** Koşullu class isimlerini birleştirir. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

const TURKISH_CHAR_MAP: Record<string, string> = {
  ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', I: 'i', İ: 'i',
  ö: 'o', Ö: 'o', ş: 's', Ş: 's', ü: 'u', Ü: 'u',
}

/** "Yeşilvadi Spor" → "yesilvadi-spor" */
export function slugify(text: string): string {
  return text
    .split('')
    .map((char) => TURKISH_CHAR_MAP[char] ?? char)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Benzersizlik için kısa rastgele ek: "yesilvadi-spor-x7k2" */
export function slugifyUnique(text: string): string {
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${slugify(text)}-${suffix}`
}
