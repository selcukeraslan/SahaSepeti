import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useAcceptStaffInvite } from '@/features/staff/hooks/useStaff'
import { inviteTokenSchema } from '@/features/staff/schemas'
import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Seo } from '@/components/Seo'

export function StaffInvite() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isLoading } = useAuth()
  const accept = useAcceptStaffInvite()
  const parsed = inviteTokenSchema.safeParse(location.hash.slice(1))
  return <Container className="py-12"><div className="mx-auto max-w-lg space-y-5 rounded-2xl border border-slate-200 p-6 dark:border-ink-800">
    <Seo title="Personel Daveti" canonicalPath="/personel-davet" index={false} />
    <h1 className="text-2xl font-bold">Personel Daveti</h1>
    <p className="text-sm text-slate-500">Daveti kabul etmek için davet edilen, e-postası doğrulanmış hesapla giriş yapın. Kayıt olmanız gerekiyorsa doğrulama sonrasında bu bağlantıyı yeniden açın.</p>
    {!parsed.success ? <p role="alert">Davet bağlantısı geçersiz. Tesis sahibinden yeni bağlantı isteyin.</p> : isLoading ? <Spinner /> : !user ? <div className="flex gap-3">
      <Link to="/giris" state={{ from: location.pathname + location.hash }}><Button>Giriş Yap</Button></Link>
      <Link to="/kayit"><Button variant="outline">Hesap Oluştur</Button></Link>
    </div> : <>
      <p className="text-sm">Giriş yapılan hesap: {user.email}</p>
      {accept.isError && <p role="alert" className="text-sm text-red-600">{accept.error.message}</p>}
      <Button isLoading={accept.isPending} onClick={() => { if (!accept.isPending) accept.mutate(parsed.data, {
        onSuccess: () => navigate('/panel/takvim', { replace: true }),
      }) }}>Daveti Kabul Et</Button>
    </>}
  </div></Container>
}
