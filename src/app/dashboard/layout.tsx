'use client'

import { useSession, signOut } from '@/lib/auth-client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, isPending } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await signOut()
    router.push('/auth/family')
  }

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-deep)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 rounded-full animate-spin"
               style={{ borderColor: 'var(--amber-glow)', borderTopColor: 'transparent' }} />
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</span>
        </div>
      </div>
    )
  }

  const isSenior = (session?.user as { role?: string } | undefined)?.role === 'senior'

  const navItems = [
    { href: '/dashboard', label: 'Overview', icon: HomeIcon },
    { href: '/dashboard/alerts', label: 'Alerts', icon: BellIcon },
    // Family management only for guardians, not seniors
    ...(!isSenior ? [{ href: '/dashboard/family', label: 'Family', icon: UsersIcon }] : []),
    { href: '/dashboard/settings', label: 'Settings', icon: SettingsIcon },
  ]

  return (
    <div className="min-h-screen dashboard-view" style={{ background: 'var(--bg-deep)' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(180deg, rgba(37, 32, 48, 0.98) 0%, rgba(37, 32, 48, 0.95) 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}>
        <div className="max-w-5xl mx-auto px-6">
          {/* Top Bar */}
          <div className="h-16 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                   style={{
                     background: 'linear-gradient(135deg, var(--amber-glow) 0%, #d97706 100%)',
                     boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                   }}>
                <ShieldIcon className="w-5 h-5" style={{ color: 'var(--bg-deep)' }} />
              </div>
              <div>
                <span className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                  GuardRails
                </span>
                <span className="ml-2 text-xs px-2 py-0.5 rounded-md"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                  Family
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
                   style={{ background: 'var(--bg-elevated)' }}>
                <div className="w-2 h-2 rounded-full" style={{ background: 'var(--success)' }} />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {session?.user?.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="dash-btn dash-btn-ghost"
              >
                {isLoggingOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex gap-1 -mb-px">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className="relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all"
                  style={{
                    color: isActive ? 'var(--amber-glow)' : 'var(--text-muted)',
                  }}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                         style={{ background: 'var(--amber-glow)' }} />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}

function ShieldIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
    </svg>
  )
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
