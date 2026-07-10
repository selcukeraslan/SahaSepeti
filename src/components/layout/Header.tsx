import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  Info,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  ShieldCheck,
  User,
} from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { signOut } from '@/features/auth/services/auth.service'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { useToast } from '@/components/ui/useToast'
import { cn } from '@/lib/utils'
import { Container } from './Container'
import { Logo } from './Logo'

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return cn(
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'text-primary-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  )
}

export function Header() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      setMenuOpen(false)
      navigate('/')
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Çıkış yapılamadı', 'error')
    }
  }

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo />

        {/* Masaüstü navigasyon */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Ana menü">
          <NavLink to="/tesisler" className={navLinkClass}>
            Tesisler
          </NavLink>
          <NavLink to="/hakkimizda" className={navLinkClass}>
            Biz Kimiz
          </NavLink>
          <NavLink to="/iletisim" className={navLinkClass}>
            İletişim
          </NavLink>
          {profile?.role === 'customer' && (
            <NavLink to="/rezervasyonlarim" className={navLinkClass}>
              Rezervasyonlarım
            </NavLink>
          )}
          {profile?.role === 'venue_owner' && (
            <NavLink to="/panel" className={navLinkClass}>
              Tesis Paneli
            </NavLink>
          )}
          {profile?.role === 'admin' && (
            <NavLink to="/admin" className={navLinkClass}>
              Admin
            </NavLink>
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <span className="max-w-40 truncate text-sm font-medium text-slate-700">
                {profile?.full_name || user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="size-4" aria-hidden />
                Çıkış
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/giris')}>
                Giriş Yap
              </Button>
              <Button size="sm" onClick={() => navigate('/kayit')}>
                Kayıt Ol
              </Button>
            </>
          )}
        </div>

        {/* Mobil menü butonu */}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Menüyü aç"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
        >
          <Menu className="size-6" />
        </button>
      </Container>

      {/* Mobil menü */}
      <Sheet open={menuOpen} onClose={closeMenu} title="Menü">
        <nav className="flex flex-col gap-1" aria-label="Mobil menü">
          <Link
            to="/tesisler"
            onClick={closeMenu}
            className="flex items-center gap-3 rounded-xl px-3 py-3 font-medium text-slate-700 hover:bg-slate-100"
          >
            <CalendarDays className="size-5 text-primary-600" aria-hidden />
            Tesisler
          </Link>
          <Link
            to="/hakkimizda"
            onClick={closeMenu}
            className="flex items-center gap-3 rounded-xl px-3 py-3 font-medium text-slate-700 hover:bg-slate-100"
          >
            <Info className="size-5 text-primary-600" aria-hidden />
            Biz Kimiz
          </Link>
          <Link
            to="/iletisim"
            onClick={closeMenu}
            className="flex items-center gap-3 rounded-xl px-3 py-3 font-medium text-slate-700 hover:bg-slate-100"
          >
            <Mail className="size-5 text-primary-600" aria-hidden />
            İletişim
          </Link>
          {profile?.role === 'customer' && (
            <Link
              to="/rezervasyonlarim"
              onClick={closeMenu}
              className="flex items-center gap-3 rounded-xl px-3 py-3 font-medium text-slate-700 hover:bg-slate-100"
            >
              <User className="size-5 text-primary-600" aria-hidden />
              Rezervasyonlarım
            </Link>
          )}
          {profile?.role === 'venue_owner' && (
            <Link
              to="/panel"
              onClick={closeMenu}
              className="flex items-center gap-3 rounded-xl px-3 py-3 font-medium text-slate-700 hover:bg-slate-100"
            >
              <LayoutDashboard className="size-5 text-primary-600" aria-hidden />
              Tesis Paneli
            </Link>
          )}
          {profile?.role === 'admin' && (
            <Link
              to="/admin"
              onClick={closeMenu}
              className="flex items-center gap-3 rounded-xl px-3 py-3 font-medium text-slate-700 hover:bg-slate-100"
            >
              <ShieldCheck className="size-5 text-primary-600" aria-hidden />
              Admin
            </Link>
          )}

          <div className="mt-4 border-t border-slate-100 pt-4">
            {user ? (
              <Button variant="outline" className="w-full" onClick={handleSignOut}>
                <LogOut className="size-4" aria-hidden />
                Çıkış Yap
              </Button>
            ) : (
              <div className="flex flex-col gap-2">
                <Button
                  className="w-full"
                  onClick={() => {
                    closeMenu()
                    navigate('/giris')
                  }}
                >
                  Giriş Yap
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    closeMenu()
                    navigate('/kayit')
                  }}
                >
                  Kayıt Ol
                </Button>
              </div>
            )}
          </div>
        </nav>
      </Sheet>
    </header>
  )
}
