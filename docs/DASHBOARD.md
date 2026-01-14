# Family Dashboard

## Purpose
Control center for adult children (guardians) to monitor their seniors' technology interactions, review security alerts, and manage family members.

## Key Files
- `src/app/dashboard/layout.tsx` - Dashboard shell with nav, header, logout
- `src/app/dashboard/page.tsx` - Overview with stats, activity feed, alerts
- `src/app/dashboard/alerts/page.tsx` - Full alerts inbox
- `src/app/dashboard/family/page.tsx` - Family member management, invites
- `src/app/dashboard/settings/page.tsx` - Notification preferences

### API Routes
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/activity` - Recent activity feed
- `GET /api/dashboard/alerts` - All alerts for family
- `PATCH /api/dashboard/alerts/[id]` - Mark alert read/dismissed
- `GET /api/dashboard/family` - List family members + pending invites
- `POST /api/dashboard/family/invite` - Send senior invite
- `DELETE /api/dashboard/family/invite/[id]` - Cancel pending invite
- `DELETE /api/dashboard/family/member/[id]` - Remove family member
- `PATCH /api/dashboard/settings` - Update notification prefs

## Database Schema

### `guardianFamilies` - Links auth users to families
```typescript
{
  id: uuid,
  authUserId: string,  // Better Auth user.id
  familyId: uuid,      // Reference to families table
  role: 'guardian' | 'admin',
  createdAt: timestamp
}
```

### `familyInvites` - Pending senior invitations
```typescript
{
  id: uuid,
  familyId: uuid,
  invitedBy: string,   // Better Auth user who sent invite
  name: string,
  email: string | null,
  phone: string | null,
  token: string,       // Secure invite token
  status: 'pending' | 'accepted' | 'expired',
  expiresAt: timestamp,
  createdAt: timestamp
}
```

## Access Control

### Role-Based Restrictions
- **Seniors** (`user.role === 'senior'`): Cannot access `/dashboard/*`
- **Guardians** (`user.role === 'family'`): Full dashboard access

### Implementation Layers
1. **Middleware** (`src/middleware.ts`): Redirects seniors from `/dashboard` to `/`
2. **Layout** (`src/app/dashboard/layout.tsx`): Hides "Family" nav for seniors
3. **Page** (`src/app/dashboard/family/page.tsx`): Redirects seniors on mount
4. **API**: All family endpoints return 403 for seniors

## Senior Invite Flow

1. Guardian clicks "Invite Senior" on `/dashboard/family`
2. Enters name + email/phone
3. `POST /api/dashboard/family/invite` creates invite record, sends email via Resend
4. Senior receives email → clicks link → `/auth/senior?token=xxx`
5. `GET /api/auth/accept-invite?token=xxx` validates token, returns invite details
6. Senior enters email → `POST /api/auth/accept-invite` creates:
   - Better Auth user with `role: 'senior'`
   - Entry in `users` table with `type: 'senior'`
   - Entry in `familyMembers` linking to family
   - Updates invite status to 'accepted'
7. Auto-generates magic link → senior signed in → redirected to `/`

## CSS Classes

Dashboard uses `dashboard-view` wrapper which enables compact UI:
```css
.dashboard-view button, .dashboard-view input { min-height: auto; }
```

Key classes:
- `.dash-card` - Glass-effect card with border
- `.dash-btn`, `.dash-btn-primary`, `.dash-btn-secondary` - Compact buttons
- `.dash-input` - Form inputs
- `.dash-badge-*` - Status badges (error, warning, success, muted)
- `.dash-stat` - Statistic display card
- `.dash-empty` - Empty state container
- `.dash-modal`, `.dash-modal-overlay` - Modal dialogs

## Patterns

### Session Check Pattern
```typescript
const { data: session, isPending } = useSession()

if (isPending) return <Loading />
if (session?.user?.role === 'senior') {
  router.replace('/dashboard')
  return null
}
```

### API Authorization Pattern
```typescript
const session = await auth.api.getSession({ headers: await headers() })
if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
if (session.user.role === 'senior') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
```

### Family Lookup Pattern
```typescript
const guardianFamily = await db
  .select()
  .from(guardianFamilies)
  .where(eq(guardianFamilies.authUserId, session.user.id))
  .limit(1)

if (guardianFamily.length === 0) {
  // User has no family - create one or return empty
}
const familyId = guardianFamily[0].familyId
```

## Gotchas

1. **Two user systems**: Better Auth `user` table vs our `users` table. Guardians exist only in Better Auth. Seniors exist in both (linked by email).

2. **Family auto-creation**: First invite from a guardian creates the `families` + `guardianFamilies` records automatically.

3. **Invite expiration**: Invites expire after 7 days. Expired invites are filtered out in queries.

4. **Role field location**: User role is on `session.user.role` (Better Auth extended schema), not in a separate table.

5. **Senior auth redirect**: Authenticated seniors hitting `/auth/family` go to `/` (not `/dashboard`).
