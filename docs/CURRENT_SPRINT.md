# Current Sprint

## Active Issues
- #14 - feat: add logout functionality for all users - in progress

## Goal
All users can sign out from appropriate locations: seniors via subtle link on chat page, family members from chat page and dashboard.

## Approach
1. **Senior Chat Page (`/` - page.tsx)**: Add subtle "Sign out" text link in footer area (lowkey, not prominent)
2. **Family Chat Page**: Family members can also access `/` - add logout there too (conditional on role)
3. **Dashboard** (already has logout): Verify `layout.tsx` logout works - already implemented in header

Key patterns:
- Use `signOut` from `@/lib/auth-client`
- Redirect seniors to `/auth/senior`, family to `/auth/family`
- Keep senior UI minimal to avoid confusion

## Out of Scope
- Logout confirmation dialogs (keep it simple)
- Session timeout auto-logout

## Definition of Done
- [ ] Seniors can logout from chat page via subtle UI element
- [ ] Family members can logout from chat page
- [ ] Family members can logout from dashboard (already done)
- [ ] Logout clears session and redirects appropriately
- [ ] Works on mobile and desktop

---

# Last Completed

**Date:** 2026-01-14
**Issues:** #8
**Summary:** Built the Family Dashboard - a control center for adult children (guardians) to monitor seniors' activity, review security alerts, manage family members, and configure notification settings.

## Key Changes
- **Dashboard UI**: Overview page with stats, activity feed, alerts preview; dedicated alerts inbox; family member management; settings page
- **Senior Invites**: Complete flow for guardians to invite seniors via email with magic link auto-signin
- **Role-Based Access**: Seniors blocked from dashboard at middleware, page, and API levels
- **Database Schema**: Added `guardianFamilies`, `familyInvites` tables; extended Better Auth user with `role` field
- **CSS System**: New `.dash-*` utility classes for compact dashboard styling

## Documentation Updated
- Feature docs: `docs/DASHBOARD.md` - created (patterns, schemas, gotchas)
- `docs/AUTH.md` - added senior invite flow documentation
- `CLAUDE.md` - added role-based access control and dashboard CSS patterns

## Follow-up Issues
- #11 - Stripe billing integration (existing, placeholder in settings)
