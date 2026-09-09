import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Seo } from '@/components/Seo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/useToast'
import { AuthShell } from '@/features/auth/components/AuthShell'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { passwordResetSchema } from '@/features/auth/schemas'
import { updatePassword } from '@/features/auth/services/auth.service'

export function ResetPassword() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user, isLoading } = useAuth()
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = passwordResetSchema.safeParse({ password, passwordConfirmation })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Şifre bilgilerini kontrol edin')
      return
    }
    setError('')
    setIsSubmitting(true)
    try {
      await updatePassword(parsed.data)
      toast('Şifreniz güncellendi. Giriş yapabilirsiniz.', 'success')
      navigate('/giris', { replace: true })
    } catch (submissionError) {
      toast(submissionError instanceof Error ? submissionError.message : 'Şifre güncellenemedi', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Seo title="Şifre Yenile" canonicalPath="/sifre-yenile" />
      <AuthShell eyebrow="Hesabını kurtar" title="Yeni şifre belirle" description={user ? 'Yeni şifreni belirleyerek hesabına devam et.' : 'Bu sayfayı yalnızca e-posta ile gelen güvenli bağlantı üzerinden açabilirsin.'} footer={<Link to="/giris" className="font-semibold text-primary-600 hover:text-primary-700">Giriş ekranına dön</Link>}>
        {isLoading ? <p className="text-sm text-slate-500">Oturum doğrulanıyor…</p> : user ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Input label="Yeni şifre" type="password" autoComplete="new-password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} />
            <Input label="Yeni şifre (tekrar)" type="password" autoComplete="new-password" placeholder="••••••••" value={passwordConfirmation} error={error} onChange={(event) => setPasswordConfirmation(event.target.value)} />
            <Button type="submit" size="lg" isLoading={isSubmitting} className="mt-2 rounded-full">Şifreyi Güncelle</Button>
          </form>
        ) : <p className="text-sm text-slate-500">Geçerli bir yenileme bağlantısı gerekli. Yeni bağlantı almak için şifre sıfırlama formunu kullan.</p>}
      </AuthShell>
    </>
  )
}
