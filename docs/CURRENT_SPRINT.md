# Current Sprint

## Active Issues
- #8 - Build Family Dashboard (Interface B) - not started

## Goal
Build the Family Dashboard - a modern control center for adult children to monitor seniors' activity and receive security alerts.

## Approach

### Phase 1: Core Dashboard Structure
1. Create `/dashboard` route with dashboard-specific layout
2. Add header with user info, logout
3. Implement activity feed (recent senior interactions from `messages` table)
4. Create alerts inbox (scam detection from `alerts` table)

### Phase 2: Family Management
5. Settings page for notification preferences
6. Link/manage family members (seniors)

### Key Decisions
- **Separate layout**: Dashboard uses standard UI, not senior-simplified
- **Reuse CSS variables**: Same design system, but denser information display
- **Better Auth integration**: Session/user from existing auth system
- **Database queries**: Use existing Drizzle schema (`alerts`, `messages`, `familyMembers`)

### Out of Scope (for this issue)
- Stripe billing (#11)
- Push notifications (#7 - depends on camera/scam detection)
- Real-time WebSocket updates (can poll initially)

## Definition of Done
- [ ] `/dashboard` route with auth protection
- [ ] Activity feed showing recent parent interactions
- [ ] Alert inbox with scam detection notifications
- [ ] Settings page for notification preferences
- [ ] Subscription/billing management (placeholder - #11)
- [ ] Add/manage family members (linked seniors)
- [ ] Issue closed with commit
- [ ] Docs updated if needed
