import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'
import { getProfile } from '@/features/auth/services/auth.service'
import type { Profile } from '@/types/database.types'
import { AuthContext, type AuthContextValue } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  /** Eski (uçuştaki) profil sonuçlarının yeni oturum state'ini ezmesini önler */
  const sessionSeq = useRef(0)

  const fetchProfile = useCallback(async (sessionUser: User | null): Promise<Profile | null> => {
    if (!sessionUser) return null
    try {
      return await getProfile(sessionUser.id)
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    // user ve profile birlikte set edilir; guard'lar hiçbir zaman
    // "user var ama profil henüz yüklenmedi" ara durumunu görmez.
    const applySession = async (session: Session | null) => {
      if (!isMounted) return
      const seq = ++sessionSeq.current
      const sessionUser = session?.user ?? null
      const sessionProfile = await fetchProfile(sessionUser)
      // Daha yeni bir oturum olayı geldiyse bu sonucu yok say
      if (!isMounted || seq !== sessionSeq.current) return
      setUser(sessionUser)
      setProfile(sessionProfile)
      setIsLoading(false)
    }

    void supabase.auth.getSession().then(({ data }) => applySession(data.session))

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      // Kullanıcıya özel cache (rezervasyonlarım, tesislerim...) çıkışta temizlenir
      if (event === 'SIGNED_OUT') {
        queryClient.clear()
      }
      void applySession(session)
    })

    return () => {
      isMounted = false
      subscription.subscription.unsubscribe()
    }
  }, [fetchProfile])

  const refreshProfile = useCallback(async () => {
    setProfile(await fetchProfile(user))
  }, [fetchProfile, user])

  const value = useMemo<AuthContextValue>(
    () => ({ user, profile, isLoading, refreshProfile }),
    [user, profile, isLoading, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
