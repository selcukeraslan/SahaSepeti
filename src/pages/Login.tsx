import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/useToast'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { loginSchema, type LoginInput } from '@/features/auth/schemas'
import { signIn } from '@/features/auth/services/auth.service'

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { user } = useAuth()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  // Oturum context'e yansıdığında yönlendir — guard yarışı olmaz.
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true })
    }
  }, [user, from, navigate])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginInput) => {
    try {
      await signIn(data)
      toast('Hoş geldiniz!', 'success')
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Giriş yapılamadı', 'error')
    }
  }

  return (
    <Container className="flex justify-center py-12 sm:py-20">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-soft sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Giriş Yap</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Rezervasyonlarınıza erişmek için giriş yapın.
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
            <Input
              label="E-posta"
              type="email"
              autoComplete="email"
              placeholder="ornek@eposta.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Şifre"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" size="lg" isLoading={isSubmitting} className="mt-2">
              Giriş Yap
            </Button>
          </form>
        </div>
        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          Hesabınız yok mu?{' '}
          <Link to="/kayit" className="font-semibold text-primary-600 hover:text-primary-700">
            Kayıt olun
          </Link>
        </p>
      </div>
    </Container>
  )
}
