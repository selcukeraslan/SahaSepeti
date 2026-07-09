import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
// Supabase'in yeni "Publishable key" ve eski "anon key" isimlerinin ikisi de desteklenir.
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) as string | undefined

/**
 * Yapılandırma eksikse import anında HATA FIRLATMAYIZ (bu, tüm uygulamayı
 * beyaz ekrana çevirir). Bunun yerine bir hata mesajı yayınlanır ve
 * main.tsx bunu kullanıcıya net bir ekranla gösterir.
 */
export const supabaseConfigError: string | null =
  !supabaseUrl || !supabaseKey
    ? 'Supabase ortam değişkenleri eksik. .env dosyasında VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY (veya VITE_SUPABASE_PUBLISHABLE_KEY) tanımlı olmalı. .env değiştirdiyseniz dev sunucusunu yeniden başlatın.'
    : null

// Eksik yapılandırmada createClient'in kendisi patlamasın diye yer tutucu verilir;
// bu istemci hiç kullanılmaz çünkü main.tsx uygulamayı mount etmez.
export const supabase = createClient<Database>(
  supabaseUrl ?? 'http://localhost:54321',
  supabaseKey ?? 'placeholder-anon-key',
)
