import { betterAuth } from 'better-auth'
import { magicLink } from 'better-auth/plugins'
import { Pool } from 'pg'
import { Resend } from 'resend'

// Lazy init to avoid build-time errors when API key not available
let resend: Resend | null = null
function getResend() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

// Map to capture magic link URLs for instant sign-in (invite flow)
// Key: email, Value: { resolve, reject } promise handlers
export const pendingMagicLinkCaptures = new Map<string, {
  resolve: (url: string) => void
  reject: (error: Error) => void
}>()


export const auth = betterAuth({
  // Base URL for generating links (magic links, etc.)
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  // Use pg Pool for Neon Postgres
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),

  // Email + password for family members
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Simplify for MVP
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days default (family)
    updateAge: 60 * 60 * 24, // Update session daily
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  // Magic link plugin for seniors - disableSignUp prevents random signups
  plugins: [
    magicLink({
      disableSignUp: true, // Only existing users can use magic link
      sendMagicLink: async ({ email, url }) => {
        // Check if we're capturing this URL for instant sign-in (invite flow)
        const capture = pendingMagicLinkCaptures.get(email)
        if (capture) {
          // Resolve the promise with the URL instead of sending email
          capture.resolve(url)
          pendingMagicLinkCaptures.delete(email)
          return
        }

        // Normal flow - send magic link email
        await getResend().emails.send({
          from: 'GuardRails <noreply@kingshotauto.com>',
          to: email,
          subject: 'Your login link for GuardRails',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #f59e0b; font-size: 28px;">Welcome to GuardRails</h1>
              <p style="font-size: 18px; color: #374151;">
                Click the button below to sign in. This link expires in 15 minutes.
              </p>
              <a href="${url}"
                 style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white;
                        padding: 16px 32px; font-size: 20px; text-decoration: none;
                        border-radius: 8px; margin: 24px 0;">
                Sign In to GuardRails
              </a>
              <p style="font-size: 14px; color: #6b7280;">
                If you didn't request this link, you can safely ignore this email.
              </p>
            </div>
          `,
        })
      },
      expiresIn: 60 * 15, // 15 minutes
    }),
  ],

  // User fields
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'family',
      },
    },
  },
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session['user']

// Helper to capture magic link URL for instant sign-in
export async function captureMagicLinkUrl(email: string, callbackURL: string = '/'): Promise<string> {
  return new Promise((resolve, reject) => {
    let resolved = false

    // Set timeout to clean up if something goes wrong
    const timeout = setTimeout(() => {
      if (!resolved) {
        pendingMagicLinkCaptures.delete(email)
        reject(new Error('Magic link generation timed out'))
      }
    }, 10000)

    // Set up capture before triggering magic link
    pendingMagicLinkCaptures.set(email, {
      resolve: (url: string) => {
        resolved = true
        clearTimeout(timeout)
        resolve(url)
      },
      reject: (error: Error) => {
        resolved = true
        clearTimeout(timeout)
        reject(error)
      },
    })

    // Trigger magic link sign-in which will call sendMagicLink
    // Need to provide headers for Better Auth API
    auth.api.signInMagicLink({
      body: { email, callbackURL },
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
    }).catch((error) => {
      if (!resolved) {
        resolved = true
        clearTimeout(timeout)
        pendingMagicLinkCaptures.delete(email)
        reject(error)
      }
    })
  })
}
