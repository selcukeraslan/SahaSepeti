import { useState } from 'react'
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BarChart3, Building2, CalendarDays, CalendarRange, LayoutDashboard, Users } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { usePanelAccess } from '@/features/staff/hooks/usePanelAccess'
import { can, PANEL_ROLE_LABELS, routePermission } from '@/features/staff/permissions'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { QueryErrorState } from '@/components/ui/QueryErrorState'

const NAV_ITEMS = [
  { to: '/panel', label: 'Genel Bakış', icon: LayoutDashboard, end: true },
  { to: '/panel/takvim', label: 'Takvim', icon: CalendarRange, end: false },
  { to: '/panel/musteriler', label: 'Müşteriler', icon: Users, end: false },
  { to: '/panel/tesisler', label: 'Tesislerim', icon: Building2, end: false },
  { to: '/panel/rezervasyonlar', label: 'Rezervasyonlar', icon: CalendarDays, end: false },
  { to: '/panel/istatistik', label: 'İstatistik', icon: BarChart3, end: false },
  { to: '/panel/personel', label: 'Personel', icon: Users, end: false },
]

export function DashboardLayout() {
  const { profile } = useAuth()
  const access = usePanelAccess()
  const location = useLocation()
  const navigate = useNavigate()
  const [selected, setSelected] = useState('')
  const requestedVenue = location.pathname.match(/^\/panel\/tesisler\/([^/]+)$/)?.[1]
  const current = access.data?.find(v => v.id === requestedVenue) ?? access.data?.find(v => v.id === selected) ?? access.data?.[0]
  const isOwner = profile?.role === 'venue_owner'
  if (access.isPending) return <Skeleton className="m-8 h-64" />
  if (access.isError) return <QueryErrorState title="Panel yetkileri yüklenemedi" isRetrying={access.isFetching} onRetry={() => { void access.refetch() }} />
  if (!current && !isOwner) return <Navigate to="/" replace />
  const creating = location.pathname === '/panel/tesisler/yeni'
  if (creating && !isOwner) return <Navigate to="/panel/takvim" replace />
  if (current && !creating && !can(current.role, routePermission(location.pathname))) return <Navigate to="/panel/takvim" replace />
  if (location.pathname.startsWith('/panel/tesisler/') && !creating && current && location.pathname !== `/panel/tesisler/${current.id}`) {
    return <Navigate to="/panel/tesisler" replace />
  }
  return (
    <Container className="py-6 sm:py-8">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Masaüstü: dikey menü / Mobil: yatay sekmeler */}
        <nav
          aria-label="Panel menüsü"
          className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible"
        >
          {NAV_ITEMS.filter(item => !current || can(current.role, routePermission(item.to))).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-600 dark:text-ink-300 hover:bg-slate-100 dark:hover:bg-ink-800 hover:text-slate-900 dark:hover:text-ink-50',
                )
              }
            >
              <item.icon className="size-4.5 shrink-0" aria-hidden />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="min-w-0">
          {current && <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 p-4 dark:border-ink-800">
            <Select aria-label="Çalışılan tesis" value={current.id} options={(access.data ?? []).map(v => ({ value: v.id, label: v.name }))}
              onChange={event => { setSelected(event.target.value); if (requestedVenue) navigate('/panel/tesisler') }} />
            <span className="text-sm text-primary-600">{PANEL_ROLE_LABELS[current.role]}</span>
          </div>}
          <Outlet key={`${current?.id}:${current?.role}`} context={{ venueId: current?.id ?? '', role: current?.role ?? 'owner' }} />
        </div>
      </div>
    </Container>
  )
}
