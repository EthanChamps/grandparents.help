'use client'

import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import Link from 'next/link'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export default function SeniorAuthPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('sending')
    setError('')

    try {
      const { error } = await authClient.signIn.magicLink({
        email: email.trim(),
        callbackURL: '/',
      })

      if (error) {
        setError(error.message || 'Something went wrong. Please try again.')
        setStatus('error')
      } else {
        setStatus('sent')
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setStatus('error')
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
          Sign in to get help
        </p>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          {status === 'sent' ? (
            /* Success State */
            <div className="card p-8 text-center glow-amber">
              <div
                className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
                style={{ background: 'var(--success)', color: 'white' }}
              >
                <CheckIcon className="w-10 h-10" />
              </div>
              <h2
                className="text-2xl font-bold mb-4"
                style={{ color: 'var(--text-primary)' }}
              >
                Check Your Email
              </h2>
              <p
                className="text-xl mb-6"
                style={{ color: 'var(--text-secondary)' }}
              >
                We sent a sign-in link to:
              </p>
              <p
                className="text-xl font-bold mb-8 p-4 rounded-xl"
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--amber-glow)',
                }}
              >
                {email}
              </p>
              <p style={{ color: 'var(--text-muted)' }}>
                Click the link in your email to sign in.
                <br />
                The link expires in 15 minutes.
              </p>

              <button
                onClick={() => {
                  setStatus('idle')
                  setEmail('')
                }}
                className="btn btn-ghost mt-8 w-full py-4 text-lg"
              >
                Use a different email
              </button>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit}>
              <div className="card p-8 glow-amber">
                <div className="text-center mb-8">
                  <div
                    className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
                    style={{ background: 'var(--bg-elevated)' }}
                  >
                    <EmailIcon
                      className="w-10 h-10"
                      style={{ color: 'var(--amber-glow)' }}
                    />
                  </div>
                  <h2
                    className="text-2xl font-bold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Sign In
                  </h2>
                  <p
                    className="text-lg"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    No password needed!
                    <br />
                    We&apos;ll email you a sign-in link.
                  </p>
                </div>

                {/* Email Input */}
                <label
                  htmlFor="email"
                  className="block text-lg font-bold mb-3"
                  style={{ color: 'var(--amber-soft)' }}
                >
                  Your Email Address:
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full input-large mb-6"
                  style={{ fontSize: '1.25rem', padding: '1.25rem' }}
                  required
                  autoComplete="email"
                  autoFocus
                />

                {/* Error */}
                {error && (
                  <div
                    className="p-4 rounded-xl mb-6 text-center"
                    style={{ background: 'var(--error)', color: 'white' }}
                  >
                    <p className="font-bold">{error}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!email.trim() || status === 'sending'}
                  className="w-full btn btn-primary py-6 text-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'sending' ? (
                    <>
                      <LoadingSpinner className="w-6 h-6" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <SendIcon className="w-6 h-6" />
                      Send Sign-In Link
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Family link */}
          <p
            className="text-center mt-8"
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
