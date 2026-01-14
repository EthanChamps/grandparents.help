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

export const auth = betterAuth({
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

  // Magic link plugin for seniors
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await getResend().emails.send({
          from: 'GuardRails <noreply@kingshotauto.com>',
          to: email,
          subject: 'Your login link for GuardRails',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #2563eb; font-size: 28px;">Welcome to GuardRails</h1>
              <p style="font-size: 18px; color: #374151;">
                Click the button below to sign in. This link expires in 15 minutes.
              </p>
              <a href="${url}"
                 style="display: inline-block; background: #2563eb; color: white;
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
