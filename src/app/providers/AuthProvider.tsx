import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { getProfile } from '@/features/auth/services/auth.service'
import type { Profile } from '@/types/database.types'
import { AuthContext, type AuthContextValue } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadProfile = useCallback(async (sessionUser: User | null) => {
    if (!sessionUser) {
      setProfile(null)
      return
    }
    try {
      setProfile(await getProfile(sessionUser.id))
    } catch {
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const applySession = async (session: Session | null) => {
      if (!isMounted) return
      const sessionUser = session?.user ?? null
      setUser(sessionUser)
      await loadProfile(sessionUser)
      if (isMounted) setIsLoading(false)
    }

    void supabase.auth.getSession().then(({ data }) => applySession(data.session))

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session)
    })

    return () => {
      isMounted = false
      subscription.subscription.unsubscribe()
    }
  }, [loadProfile])

  const refreshProfile = useCallback(async () => {
    await loadProfile(user)
  }, [loadProfile, user])

  const value = useMemo<AuthContextValue>(
    () => ({ user, profile, isLoading, refreshProfile }),
    [user, profile, isLoading, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
