'use client'

import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Mode = 'login' | 'register'

export default function FamilyAuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    if (mode === 'register' && !name.trim()) return

    setIsLoading(true)
    setError('')

    try {
      if (mode === 'login') {
        const { error } = await authClient.signIn.email({
          email: email.trim(),
          password,
        })
        if (error) {
          setError(error.message || 'Invalid email or password')
          setIsLoading(false)
          return
        }
      } else {
        const { error } = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: name.trim(),
        })
        if (error) {
          setError(error.message || 'Could not create account')
          setIsLoading(false)
          return
        }
      }
      router.push('/dashboard')
    } catch {
      setError('Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-dvh flex flex-col safe-area-inset"
      style={{ background: 'var(--bg-deep)' }}
    >
      {/* Header */}
      <header
        className="px-6 py-4 border-b"
        style={{ borderColor: 'var(--bg-elevated)' }}
      >
        <h1
          className="text-2xl font-extrabold"
          style={{ color: 'var(--amber-glow)' }}
        >
          GuardRails
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Family Dashboard
        </p>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          <form onSubmit={handleSubmit}>
            <div className="card p-8">
              <div className="text-center mb-6">
                <div
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                  style={{ background: 'var(--bg-elevated)' }}
                >
                  <FamilyIcon
                    className="w-8 h-8"
                    style={{ color: 'var(--amber-glow)' }}
                  />
                </div>
                <h2
                  className="text-xl font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {mode === 'login' ? 'Family Sign In' : 'Create Account'}
                </h2>
              </div>

              {/* Mode Toggle */}
              <div
                className="flex rounded-xl mb-6 p-1"
                style={{ background: 'var(--bg-elevated)' }}
              >
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="flex-1 py-3 rounded-lg font-semibold transition-all"
                  style={{
                    background: mode === 'login' ? 'var(--amber-glow)' : 'transparent',
                    color: mode === 'login' ? 'var(--bg-deep)' : 'var(--text-secondary)',
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="flex-1 py-3 rounded-lg font-semibold transition-all"
                  style={{
                    background: mode === 'register' ? 'var(--amber-glow)' : 'transparent',
                    color: mode === 'register' ? 'var(--bg-deep)' : 'var(--text-secondary)',
                  }}
                >
                  Register
                </button>
              </div>

              {/* Name (register only) */}
              {mode === 'register' && (
                <div className="mb-4">
                  <label
                    htmlFor="name"
                    className="block text-sm font-semibold mb-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Your Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Smith"
                    className="w-full input-large"
                    required={mode === 'register'}
                    autoComplete="name"
                  />
                </div>
              )}

              {/* Email */}
              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full input-large"
                  required
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div className="mb-6">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full input-large"
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  minLength={8}
                />
              </div>

              {/* Error */}
              {error && (
                <div
                  className="p-4 rounded-xl mb-6 text-center"
                  style={{ background: 'var(--error)', color: 'white' }}
                >
                  <p className="font-semibold">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || !email.trim() || !password.trim() || (mode === 'register' && !name.trim())}
                className="w-full btn btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner className="w-5 h-5" />
                    {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : mode === 'login' ? (
                  'Sign In'
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>

          {/* Senior link */}
          <p
            className="text-center mt-6"
            style={{ color: 'var(--text-muted)' }}
          >
            Are you a senior?{' '}
            <Link
              href="/auth/senior"
              className="underline font-bold"
              style={{ color: 'var(--amber-glow)' }}
            >
              Sign in without password
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

/* Icons */
function FamilyIcon({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <svg className={className} style={style} fill="currentColor" viewBox="0 0 24 24">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    </svg>
  )
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}
