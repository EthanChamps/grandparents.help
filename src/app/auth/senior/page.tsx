'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import Link from 'next/link'

type Status = 'idle' | 'sending' | 'sent' | 'error' | 'accepting' | 'accepted'

interface InviteData {
  valid: boolean
  name: string
  email?: string
  phone?: string
}

// Wrapper component to handle Suspense
export default function SeniorAuthPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <SeniorAuthContent />
    </Suspense>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center safe-area-inset"
         style={{ background: 'var(--bg-deep)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 rounded-full animate-spin"
             style={{ borderColor: 'var(--amber-glow)', borderTopColor: 'transparent' }} />
        <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>
          Loading...
        </p>
      </div>
    </div>
  )
}

function SeniorAuthContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [inviteData, setInviteData] = useState<InviteData | null>(null)
  const [isLoadingInvite, setIsLoadingInvite] = useState(!!token)

  // Check for invite token on mount
  useEffect(() => {
    if (token) {
      validateInvite(token)
    }
  }, [token])

  const validateInvite = async (inviteToken: string) => {
    setIsLoadingInvite(true)
    try {
      const res = await fetch(`/api/auth/accept-invite?token=${inviteToken}`)
      if (res.ok) {
        const data = await res.json()

        // If invite has email, auto-accept and sign in immediately
        if (data.email) {
          // Don't await - let it redirect while we stay in loading state
          autoAcceptInvite(inviteToken, data.email)
          // Keep isLoadingInvite true - we're redirecting
          return
        }

        // No email on invite - show form to enter email
        setInviteData(data)
        setIsLoadingInvite(false)
      } else {
        const data = await res.json()
        setError(data.error || 'Invalid or expired invite')
        setInviteData(null)
        setIsLoadingInvite(false)
      }
    } catch {
      setError('Failed to validate invite')
      setInviteData(null)
      setIsLoadingInvite(false)
    }
  }

  const autoAcceptInvite = async (inviteToken: string, inviteEmail: string) => {
    try {
      const acceptRes = await fetch('/api/auth/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: inviteToken, email: inviteEmail }),
      })

      if (!acceptRes.ok) {
        const data = await acceptRes.json()
        throw new Error(data.error || 'Failed to accept invite')
      }

      const data = await acceptRes.json()

      if (data.redirectTo) {
        // Auto sign-in via magic link
        window.location.href = data.redirectTo
      } else if (data.needsMagicLink) {
        // Fallback: show magic link sent state
        setEmail(inviteEmail)
        setStatus('sent')
        setIsLoadingInvite(false)
      } else {
        window.location.href = '/'
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsLoadingInvite(false)
    }
  }

  const handleAcceptInvite = async () => {
    if (!token || !email.trim()) return

    setStatus('accepting')
    setError('')

    try {
      // Accept the invite - this also creates a session and sets the cookie
      const acceptRes = await fetch('/api/auth/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email: email.trim() }),
      })

      if (!acceptRes.ok) {
        const data = await acceptRes.json()
        throw new Error(data.error || 'Failed to accept invite')
      }

      const data = await acceptRes.json()

      // Redirect to home - user is already signed in via session cookie
      if (data.redirectTo) {
        window.location.href = data.redirectTo
      } else {
        window.location.href = '/'
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('error')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    // If we have an invite token, accept it first
    if (token && inviteData) {
      await handleAcceptInvite()
      return
    }

    // Regular magic link flow (for existing users only)
    setStatus('sending')
    setError('')

    try {
      const { error } = await authClient.signIn.magicLink({
        email: email.trim(),
        callbackURL: '/',
      })

      if (error) {
        // Handle "user not found" error from disableSignUp
        if (error.message?.toLowerCase().includes('user') ||
            error.message?.toLowerCase().includes('not found') ||
            error.message?.toLowerCase().includes('sign up')) {
          setError('No account found with this email. Please ask a family member to send you an invite link.')
        } else {
          setError(error.message || 'Something went wrong. Please try again.')
        }
        setStatus('error')
      } else {
        setStatus('sent')
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  // Loading invite validation / auto sign-in
  if (isLoadingInvite) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center safe-area-inset"
           style={{ background: 'var(--bg-deep)' }}>
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner className="w-12 h-12" style={{ color: 'var(--amber-glow)' }} />
          <p className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Signing you in...
          </p>
          <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
            Welcome to GuardRails!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-dvh flex flex-col safe-area-inset"
      style={{ background: 'var(--bg-deep)' }}
    >
      {/* Header */}
      <header
        className="px-4 sm:px-6 py-3 sm:py-4 border-b"
        style={{ borderColor: 'var(--bg-elevated)' }}
      >
        <h1
          className="text-xl sm:text-2xl font-extrabold"
          style={{ color: 'var(--amber-glow)' }}
        >
          GuardRails
        </h1>
        <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
          {inviteData ? 'Accept your invitation' : 'Sign in to get help'}
        </p>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          {status === 'sent' || status === 'accepted' ? (
            /* Success State */
            <div className="card text-center glow-amber">
              <div
                className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full mb-4 sm:mb-6"
                style={{ background: 'var(--success)', color: 'white' }}
              >
                <CheckIcon className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <h2
                className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4"
                style={{ color: 'var(--text-primary)' }}
              >
                {status === 'accepted' ? 'Welcome to GuardRails!' : 'Check Your Email'}
              </h2>
              <p
                className="text-base sm:text-xl mb-4 sm:mb-6"
                style={{ color: 'var(--text-secondary)' }}
              >
                {status === 'accepted'
                  ? 'We sent you a sign-in link:'
                  : 'We sent a sign-in link to:'}
              </p>
              <p
                className="text-base sm:text-xl font-bold mb-6 sm:mb-8 p-3 sm:p-4 rounded-xl break-all"
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--amber-glow)',
                }}
              >
                {email}
              </p>
              <p className="text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
                Click the link in your email to sign in.
                <br />
                The link expires in 15 minutes.
              </p>

              <button
                onClick={() => {
                  setStatus('idle')
                  setEmail('')
                  setInviteData(null)
                }}
                className="btn btn-ghost mt-6 sm:mt-8 w-full py-3 sm:py-4 text-base sm:text-lg"
              >
                Use a different email
              </button>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit}>
              <div className="card glow-amber">
                <div className="text-center mb-6 sm:mb-8">
                  <div
                    className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full mb-4 sm:mb-6"
                    style={{ background: inviteData ? 'var(--success)' : 'var(--bg-elevated)' }}
                  >
                    {inviteData ? (
                      <PartyIcon className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: 'white' }} />
                    ) : (
                      <EmailIcon className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: 'var(--amber-glow)' }} />
                    )}
                  </div>

                  {inviteData ? (
                    /* Invite welcome */
                    <>
                      <h2
                        className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Welcome, {inviteData.name}!
                      </h2>
                      <p
                        className="text-base sm:text-lg"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Your family invited you to GuardRails.
                        <br />
                        Let&apos;s get you set up!
                      </p>
                    </>
                  ) : (
                    /* Regular sign in */
                    <>
                      <h2
                        className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Welcome Back
                      </h2>
                      <p
                        className="text-base sm:text-lg"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        No password needed!
                        <br />
                        We&apos;ll email you a sign-in link.
                      </p>
                      <p
                        className="text-xs sm:text-sm mt-2 sm:mt-3"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        New here? Ask a family member to invite you.
                      </p>
                    </>
                  )}
                </div>

                {/* Email Input */}
                <label
                  htmlFor="email"
                  className="block text-base sm:text-lg font-bold mb-2 sm:mb-3"
                  style={{ color: 'var(--amber-soft)' }}
                >
                  {inviteData ? 'Confirm Your Email:' : 'Your Email Address:'}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full input-large mb-4 sm:mb-6"
                  style={{ fontSize: '1rem' }}
                  required
                  autoComplete="email"
                  autoFocus={!inviteData?.email}
                />

                {/* Error */}
                {error && (
                  <div
                    className="p-3 sm:p-4 rounded-xl mb-4 sm:mb-6 text-center"
                    style={{ background: 'var(--error)', color: 'white' }}
                  >
                    <p className="font-bold text-sm sm:text-base">{error}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!email.trim() || status === 'sending' || status === 'accepting'}
                  className="w-full btn btn-primary py-4 sm:py-6 text-base sm:text-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ minHeight: '60px' }}
                >
                  {status === 'sending' || status === 'accepting' ? (
                    <>
                      <LoadingSpinner className="w-5 h-5 sm:w-6 sm:h-6" />
                      {status === 'accepting' ? 'Setting up...' : 'Sending...'}
                    </>
                  ) : inviteData ? (
                    <>
                      <CheckIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      Join GuardRails
                    </>
                  ) : (
                    <>
                      <SendIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      Send Sign-In Link
                    </>
                  )}
                </button>

                {/* What is GuardRails - shown for invites */}
                {inviteData && (
                  <div className="mt-6 sm:mt-8 p-3 sm:p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                    <p className="text-xs sm:text-sm font-bold mb-1 sm:mb-2" style={{ color: 'var(--amber-glow)' }}>
                      What is GuardRails?
                    </p>
                    <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                      GuardRails helps you stay safe online. Ask questions about technology,
                      or scan suspicious messages to check if they&apos;re scams.
                      Your family will be notified if we detect something dangerous.
                    </p>
                  </div>
                )}
              </div>
            </form>
          )}

          {/* Family link - only show if not an invite flow */}
          {!inviteData && (
            <p
              className="text-center mt-6 sm:mt-8 text-sm sm:text-base"
              style={{ color: 'var(--text-muted)' }}
            >
              Are you a family member?{' '}
              <Link
                href="/auth/family"
                className="underline font-bold"
                style={{ color: 'var(--amber-glow)' }}
              >
                Sign in here
              </Link>
            </p>
          )}
        </div>
      </main>
    </div>
  )
}

/* Icons */
function EmailIcon({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <svg className={className} style={style} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  )
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  )
}

function PartyIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="currentColor" viewBox="0 0 24 24">
      <path d="M2 22l1-1h18l1 1H2zM5.5 4.5l-1-1 1.5-1.5 1 1-1.5 1.5zm13 0l1.5-1.5 1 1-1.5 1.5-1-1zM12 2v2h-1V2h1zm7.5 8.5l1.5-1.5 1 1-1.5 1.5-1-1zM4.5 9l-1.5 1.5-1-1L3.5 8l1 1zm6.5-3a6 6 0 016 6v8H5v-8a6 6 0 016-6z" />
    </svg>
  )
}

function LoadingSpinner({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={`${className} animate-spin`} style={style} fill="none" viewBox="0 0 24 24">
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
