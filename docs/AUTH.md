# Authentication

## Purpose
Dual auth system for seniors (passwordless) and family members (email/password) using Better Auth with Neon Postgres.

## Key Files
- `src/lib/auth.ts` - Better Auth server configuration
- `src/lib/auth-client.ts` - React client hooks (useSession, signIn, signOut)
- `src/app/api/auth/[...all]/route.ts` - Auth API catch-all handler
- `src/app/auth/senior/page.tsx` - Magic link login (senior-friendly UI)
- `src/app/auth/family/page.tsx` - Email/password login + registration
- `src/middleware.ts` - Route protection

## Database Tables
Better Auth uses these tables in `public` schema:
- `user` - User accounts (id, name, email, role)
- `session` - Active sessions
- `account` - OAuth/credential accounts
- `verification` - Magic link tokens

**Note:** These are separate from our custom `users`/`sessions` tables in the Drizzle schema. They coexist.

## Auth Flows

### Senior (Magic Link - Direct)
1. User enters email at `/auth/senior`
2. `authClient.signIn.magicLink({ email })` called
3. Better Auth creates verification token, calls `sendMagicLink`
4. Resend sends email with link
5. User clicks link → session created → redirected to `/`

### Senior (Invite Flow)
1. Guardian sends invite from `/dashboard/family`
2. `POST /api/dashboard/family/invite` creates `familyInvites` record
3. Email sent via Resend with invite link
4. Senior clicks link → `/auth/senior?token=xxx`
5. `GET /api/auth/accept-invite?token=xxx` validates, returns invite details
6. Senior enters email → `POST /api/auth/accept-invite`:
   - Creates Better Auth user with `role: 'senior'`
   - Creates entry in `users` table
   - Links to family via `familyMembers`
   - Generates magic link for auto-signin
7. Senior redirected to `/` with active session

### Family (Email/Password)
1. User enters credentials at `/auth/family`
2. Login: `authClient.signIn.email({ email, password })`
3. Register: `authClient.signUp.email({ email, password, name })`
4. Session created → redirected to `/dashboard`

## Session Management
```typescript
// Client-side session check
const { data: session, isPending } = authClient.useSession()

// Check if authenticated
if (session?.user) {
  // User is logged in
}

// Sign out
await authClient.signOut()
```

## Route Protection
Middleware protects routes and redirects:
- Protected: `/`, `/dashboard`, `/camera`
- Auth routes redirect to app if already logged in

## Configuration

### Environment Variables
```env
DATABASE_URL=postgresql://...     # Neon connection string
RESEND_API_KEY=re_xxxxx          # For magic link emails
NEXT_PUBLIC_APP_URL=http://...   # Base URL for auth callbacks
```

### Session Duration
- Senior: 30 days (configured via magic link)
- Family: 7 days default

## Gotchas

1. **Better Auth CLI won't work with Neon** - Use MCP or direct SQL to create tables. The CLI tries to connect to localhost.

2. **Tables must exist first** - Better Auth doesn't auto-create. Required tables:
   ```sql
   CREATE TABLE "user" (...)
   CREATE TABLE "session" (...)
   CREATE TABLE "account" (...)
   CREATE TABLE "verification" (...)
   ```

3. **Resend domain verification** - Magic links only work from verified domains. Use a domain you control.

4. **Two user tables** - `user` (Better Auth) vs `users` (our Drizzle schema). Link them via email if needed.

5. **Middleware deprecation warning** - Next.js 16+ shows warning about middleware → proxy. Works fine, migration optional.

## Adding OAuth Providers
```typescript
// In src/lib/auth.ts
export const auth = betterAuth({
  // ...existing config
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
})
```

## Testing Auth
1. Start dev server: `npm run dev`
2. Visit `/auth/senior` or `/auth/family`
3. For magic link: check email or console for link
4. Session persists in cookies
