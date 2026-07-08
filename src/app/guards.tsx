import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Spinner } from '@/components/ui/Spinner'
import type { UserRole } from '@/types/database.types'

/** Giriş zorunlu — girilmemişse login'e yönlendirir, dönüş adresini saklar. */
export function RequireAuth() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <Spinner />
  if (!user) {
    return <Navigate to="/giris" state={{ from: location.pathname + location.search }} replace />
  }
  return <Outlet />
}

/** Belirli bir rol zorunlu — rol uymuyorsa ana sayfaya yönlendirir. */
export function RequireRole({ role }: { role: UserRole }) {
  const { user, profile, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <Spinner />
  if (!user) {
    return <Navigate to="/giris" state={{ from: location.pathname + location.search }} replace />
  }
  if (profile?.role !== role) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
