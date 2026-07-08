import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from '@/app/providers/auth-context'

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth yalnızca AuthProvider içinde kullanılabilir')
  }
  return context
}
