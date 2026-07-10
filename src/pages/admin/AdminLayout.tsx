import { NavLink, Outlet } from 'react-router-dom'
import { Building2, CalendarDays, Inbox } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/admin', label: 'Onay Kuyruğu', icon: Inbox, end: true },
  { to: '/admin/tesisler', label: 'Tüm Tesisler', icon: Building2, end: false },
  { to: '/admin/rezervasyonlar', label: 'Rezervasyonlar', icon: CalendarDays, end: false },
]

export function AdminLayout() {
  return (
    <Container className="py-6 sm:py-8">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav
          aria-label="Admin menüsü"
          className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-ink-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-ink-50',
                )
              }
            >
              <item.icon className="size-4.5 shrink-0" aria-hidden />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </Container>
  )
}
