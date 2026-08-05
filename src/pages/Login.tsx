import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Seo } from '@/components/Seo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/useToast'
import { AuthShell } from '@/features/auth/components/AuthShell'
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
    <>
      <Seo title="Giriş Yap" canonicalPath="/giris" />
      <AuthShell
        eyebrow="Tekrar hoş geldin"
        title="Giriş yap"
        description="Rezervasyonlarına ve favori tesislerine kaldığın yerden ulaş."
        footer={<>
          Hesabınız yok mu?{' '}
          <Link to="/kayit" className="font-semibold text-primary-600 hover:text-primary-700">
            Kayıt olun
          </Link>
        </>}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Input label="E-posta" type="email" autoComplete="email" placeholder="ornek@eposta.com" error={errors.email?.message} {...register('email')} />
          <Input label="Şifre" type="password" autoComplete="current-password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
          <Button type="submit" size="lg" isLoading={isSubmitting} className="mt-2 rounded-full">Giriş yap</Button>
        </form>
      </AuthShell>
    </>
  )
}
