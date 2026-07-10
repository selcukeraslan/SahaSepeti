export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'sahasepeti-theme'

/** Kayıtlı tema; hiç seçim yoksa varsayılan olarak 'dark'. */
export function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

/** <html> üzerindeki .dark sınıfını ayarlar ve seçimi kalıcılaştırır. */
export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    /* localStorage erişilemezse tema yine de uygulanır */
  }
}
