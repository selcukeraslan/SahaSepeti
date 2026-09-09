import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Seo } from '@/components/Seo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/useToast'
import { AuthShell } from '@/features/auth/components/AuthShell'
import { emailSchema, type EmailInput } from '@/features/auth/schemas'
import { resendConfirmationEmail } from '@/features/auth/services/auth.service'

export function ResendConfirmation() {
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = emailSchema.safeParse({ email } satisfies EmailInput)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Geçerli bir e-posta girin')
      return
    }
    setError('')
    setIsSubmitting(true)
    try {
      await resendConfirmationEmail(parsed.data)
      toast('Doğrulama e-postası gönderildi.', 'success')
    } catch (submissionError) {
      toast(submissionError instanceof Error ? submissionError.message : 'E-posta gönderilemedi', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Seo title="Doğrulama E-postası" canonicalPath="/dogrulama-maili" />
      <AuthShell eyebrow="Hesabını doğrula" title="Doğrulama e-postasını yeniden gönder" description="Kayıt sırasında gelen bağlantıyı bulamadıysan yeni bir bağlantı isteyebilirsin." footer={<Link to="/giris" className="font-semibold text-primary-600 hover:text-primary-700">Giriş ekranına dön</Link>}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Input label="E-posta" type="email" autoComplete="email" placeholder="ornek@eposta.com" value={email} error={error} onChange={(event) => setEmail(event.target.value)} />
          <Button type="submit" size="lg" isLoading={isSubmitting} className="mt-2 rounded-full">E-postayı Gönder</Button>
        </form>
      </AuthShell>
    </>
  )
}
