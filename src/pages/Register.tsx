import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Building2, User } from 'lucide-react'
import { Seo } from '@/components/Seo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/useToast'
import { AuthShell } from '@/features/auth/components/AuthShell'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { registerSchema, type RegisterInput } from '@/features/auth/schemas'
import { signUp } from '@/features/auth/services/auth.service'
import { cn } from '@/lib/utils'

export function Register() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const { profile } = useAuth()
  const initialRole = searchParams.get('rol') === 'tesis' ? 'venue_owner' : 'customer'

  // Profil context'e yansıdığında role göre yönlendir — guard yarışı olmaz.
  useEffect(() => {
    if (profile) {
      navigate(profile.role === 'venue_owner' ? '/panel' : '/', { replace: true })
    }
  }, [profile, navigate])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: initialRole },
  })

  const role = watch('role')

  const onSubmit = async (data: RegisterInput) => {
    try {
      const result = await signUp(data)
      if (result.needsEmailConfirmation) {
        toast('Kaydınız oluşturuldu — lütfen e-postanızı doğrulayın', 'info')
        navigate('/giris')
      } else {
        toast('Kaydınız oluşturuldu, hoş geldiniz!', 'success')
        // Yönlendirme, profil yüklendiğinde yukarıdaki effect ile yapılır.
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Kayıt oluşturulamadı', 'error')
    }
  }

  return (
    <>
      <Seo title="Kayıt Ol" canonicalPath="/kayit" />
      <AuthShell
        eyebrow="Aramıza katıl"
        title="Ücretsiz hesap oluştur"
        description="Oyuncu veya tesis sahibi hesabını seçerek birkaç adımda başla."
        footer={<>
          Zaten hesabınız var mı?{' '}
          <Link to="/giris" className="font-semibold text-primary-600 hover:text-primary-700">Giriş yapın</Link>
        </>}
      >
          {/* Rol seçimi */}
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Hesap türü">
            {(
              [
                { value: 'customer', label: 'Oyuncuyum', icon: User },
                { value: 'venue_owner', label: 'Tesis Sahibiyim', icon: Building2 },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={role === option.value}
                onClick={() => setValue('role', option.value)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-2xl border px-3 py-4 text-sm font-medium transition-colors',
                  role === option.value
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-ink-700 dark:text-ink-300 dark:hover:border-ink-600',
                )}
              >
                <option.icon className="size-5" aria-hidden />
                {option.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 flex flex-col gap-4" noValidate>
            <Input
              label="Ad Soyad"
              autoComplete="name"
              placeholder="Adınız Soyadınız"
              error={errors.fullName?.message}
              {...register('fullName')}
            />
            <Input
              label="E-posta"
              type="email"
              autoComplete="email"
              placeholder="ornek@eposta.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Cep Telefonu (isteğe bağlı)"
              type="tel"
              autoComplete="tel"
              placeholder="05xx xxx xx xx"
              error={errors.phone?.message}
              {...register('phone')}
            />
            <Input
              label="Şifre"
              type="password"
              autoComplete="new-password"
              placeholder="En az 8 karakter"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" size="lg" isLoading={isSubmitting} className="mt-2 rounded-full">
              Hesap Oluştur
            </Button>
          </form>
      </AuthShell>
    </>
  )
}
