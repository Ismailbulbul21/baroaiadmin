import { useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const NAV_GROUPS: { heading: string; items: { to: string; label: string }[] }[] = [
  {
    heading: 'Referrals',
    items: [
      { to: '/', label: 'Overview' },
      { to: '/codes', label: 'Codes' },
      { to: '/payouts', label: 'Payouts' },
    ],
  },
  {
    heading: 'Billing',
    items: [
      { to: '/revenue', label: 'Revenue' },
      { to: '/subscriptions', label: 'Subscriptions' },
      { to: '/payments', label: 'Payments' },
      { to: '/plans', label: 'Plans' },
    ],
  },
]

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.heading}>
          <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {group.heading}
          </p>
          <div className="flex flex-col gap-1">
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-gradient text-white shadow-sm'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const { signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-navy px-4 py-6 lg:flex">
        <div className="mb-8 px-2">
          <p className="text-lg font-semibold text-white">Baro-Ai</p>
          <p className="text-xs text-slate-400">Referral Admin</p>
        </div>
        <NavLinks />
        <div className="mt-auto px-2">
          <button
            onClick={() => signOut()}
            className="w-full rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-navy px-4 py-3 lg:hidden">
        <div>
          <p className="text-base font-semibold text-white">Baro-Ai</p>
          <p className="text-[11px] text-slate-400">Referral Admin</p>
        </div>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          className="rounded-md p-2 text-white hover:bg-white/10"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>
      {menuOpen && (
        <div className="bg-navy px-4 pb-4 lg:hidden">
          <NavLinks onNavigate={() => setMenuOpen(false)} />
          <button
            onClick={() => signOut()}
            className="mt-3 w-full rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white"
          >
            Sign out
          </button>
        </div>
      )}

      <main className="px-4 py-6 lg:ml-64 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  )
}
