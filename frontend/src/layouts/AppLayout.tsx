import { useState } from 'react'
import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ClipboardList,
  History,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  TreePine,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../hooks/useAuth'
import { initials } from '../utils/formatters'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: TreePine },
  { to: '/alerts', label: 'Alerts', icon: AlertTriangle },
  { to: '/actions', label: 'Actions', icon: ClipboardList },
  { to: '/audit', label: 'Audit Log', icon: History },
]

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-offwhite">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-charcoal-100 bg-forest-950 md:flex">
        <SidebarContent onNavigate={() => undefined} />
      </aside>

      {/* Mobile drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-charcoal-950/50"
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 flex h-full w-64 flex-col bg-forest-950 shadow-card-hover">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              aria-label="Close navigation menu"
              className="absolute right-3 top-3 rounded-md p-1.5 text-forest-200 hover:bg-forest-900"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            <SidebarContent onNavigate={() => setIsDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-h-screen flex-col md:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-charcoal-100 bg-white/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open navigation menu"
            className="rounded-md p-2 text-charcoal-600 hover:bg-charcoal-100 md:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-100 text-xs font-semibold text-forest-800">
                  {initials(user.full_name)}
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium leading-tight text-charcoal-900">
                    {user.full_name}
                  </p>
                  <p className="text-xs leading-tight text-charcoal-500">{user.email}</p>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-charcoal-600 hover:bg-charcoal-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-forest-700"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}

function SidebarContent({ onNavigate }: { onNavigate: () => void }) {
  return (
    <>
      <div className="flex h-16 items-center gap-2.5 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-500/20 text-forest-300">
          <Leaf className="h-[18px] w-[18px]" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-white">Darukaa.Earth</p>
          <p className="text-[11px] leading-tight text-forest-300">Nature Intelligence</p>
        </div>
      </div>
      <nav className="mt-4 flex flex-1 flex-col gap-1 px-3" aria-label="Primary">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-forest-800 text-white'
                  : 'text-forest-200 hover:bg-forest-900 hover:text-white',
              )
            }
          >
            <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-forest-900 px-5 py-4 text-[11px] text-forest-400">
        Darukaa.Earth © {new Date().getFullYear()}
      </div>
    </>
  )
}
