import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { queryClient } from '@/lib/queryClient'
import {
  getCurrentSession,
  getProfile,
  subscribeToAuthChanges,
} from '@/features/auth/services/auth.service'
import type { Profile } from '@/types/database.types'
import { AuthContext, type AuthContextValue } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  /** Eski (uçuştaki) profil sonuçlarının yeni oturum state'ini ezmesini önler */
  const sessionSeq = useRef(0)
  /** Hesap doğrudan değiştiğinde önceki kullanıcıya ait query cache'ini temizlemek için. */
  const activeUserId = useRef<string | null | undefined>(undefined)

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
      const nextUserId = sessionUser?.id ?? null
      if (activeUserId.current !== undefined && activeUserId.current !== nextUserId) {
        // Guard'ların profil yüklenirken önceki kullanıcı/rol çiftini görmesini engelle.
        setIsLoading(true)
        queryClient.clear()
      }
      activeUserId.current = nextUserId
      const sessionProfile = await fetchProfile(sessionUser)
      // Daha yeni bir oturum olayı geldiyse bu sonucu yok say
      if (!isMounted || seq !== sessionSeq.current) return
      setUser(sessionUser)
      setProfile(sessionProfile)
      setIsLoading(false)
    }

    void getCurrentSession()
      .then(applySession)
      .catch(() => {
        // Başlangıç okuması başarısız olsa bile daha yeni bir auth olayıyla gelen
        // geçerli oturumu null state ile ezme; yalnızca açılış beklemesini sonlandır.
        if (isMounted) setIsLoading(false)
      })

    const unsubscribe = subscribeToAuthChanges((event, session) => {
      // Kullanıcıya özel cache (rezervasyonlarım, tesislerim...) çıkışta temizlenir
      if (event === 'SIGNED_OUT') {
        queryClient.clear()
      }
      void applySession(session)
    })

    return () => {
      isMounted = false
      unsubscribe()
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
