import { createContext } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types/database.types'

export interface AuthContextValue {
  user: User | null
  profile: Profile | null
  /** İlk oturum kontrolü tamamlanana kadar true */
  isLoading: boolean
  /** Profil değişikliği sonrası (örn. ad güncelleme) yeniden yükler */
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
