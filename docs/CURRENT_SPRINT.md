# Current Sprint

## Active Issues
- #9 - Implement Authentication System - in progress

## Goal
Dual auth system: passwordless magic links for seniors, email/password for family members.

## Approach

### Stack
- **Neon Auth** (already provisioned) - managed Better Auth service
- **Better Auth** - TypeScript auth library
- Uses `neon_auth` schema (user, session, account, verification tables)

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Auth Flow                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SENIOR (/auth/senior)          FAMILY (/auth/family)       │
│  ┌─────────────────────┐        ┌─────────────────────┐     │
│  │ Enter email/phone   │        │ Email + Password    │     │
│  │         ↓           │        │         ↓           │     │
│  │ Magic link sent     │        │ Standard login      │     │
│  │         ↓           │        │         ↓           │     │
│  │ Click link → auth   │        │ Session created     │     │
│  └─────────────────────┘        └─────────────────────┘     │
│              ↓                            ↓                 │
│              └──────────┬─────────────────┘                 │
│                         ↓                                   │
│              ┌─────────────────────┐                        │
│              │ neon_auth.session   │                        │
│              │ neon_auth.user      │                        │
│              └─────────────────────┘                        │
│                         ↓                                   │
│              ┌─────────────────────┐                        │
│              │ Middleware check    │                        │
│              │ /dashboard, /camera │                        │
│              └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### Key Decisions
1. **Use Neon Auth's schema** - not our custom Drizzle schema for auth
2. **Better Auth plugins**: `magicLink` for seniors, `emailAndPassword` for family
3. **Session duration**: 30 days for seniors, 7 days for family
4. **Email-first for MVP** - SMS magic links can be added later via Twilio

### File Structure
```
src/
├── lib/
│   ├── auth.ts           # Better Auth server config
│   └── auth-client.ts    # Better Auth React client
├── app/
│   ├── api/auth/[...all]/route.ts  # Auth API handler
│   ├── auth/
│   │   ├── senior/page.tsx         # Magic link login
│   │   └── family/
│   │       ├── page.tsx            # Email/password login
│   │       └── register/page.tsx   # Family signup
│   └── (protected)/                # Route group with auth
│       ├── layout.tsx              # Auth check wrapper
│       ├── page.tsx                # Main app (currently /)
│       └── dashboard/page.tsx      # Family dashboard
└── middleware.ts         # Route protection
```

### Session Strategy
| User Type | Session Duration | Auth Method |
|-----------|-----------------|-------------|
| Senior    | 30 days         | Magic link (email) |
| Family    | 7 days          | Email + password |

## Implementation Steps
1. Install `better-auth` + dependencies
2. Create `src/lib/auth.ts` - server config with Neon
3. Create `src/lib/auth-client.ts` - React hooks
4. Create `/api/auth/[...all]/route.ts` - API handler
5. Build `/auth/senior` page - big buttons, simple flow
6. Build `/auth/family` page - standard login form
7. Add `middleware.ts` - protect routes
8. Move current page.tsx to protected route group

## Definition of Done
- [ ] `npm run build` succeeds
- [ ] Senior can log in via magic link
- [ ] Family can log in via email/password
- [ ] Protected routes redirect to auth
- [ ] Session persists across browser refresh
- [ ] Logout works for both user types
- [ ] Issue #9 closed with commit

## Risks
- **Neon Auth schema vs our schema**: May need to link `neon_auth.user` to our `public.users` table later
- **Magic link delivery**: Need email provider (Resend recommended)
