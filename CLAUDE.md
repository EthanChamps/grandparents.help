# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**grandparents.help** (codename: GuardRails) is a Family Defense Platform — a PWA helping seniors navigate technology safely while alerting adult children to potential scams.

## Architecture

### Dual-Interface System
The app has two completely separate interfaces sharing a backend:

1. **Senior View** — Radical simplicity
   - WCAG AAA compliant, 60px+ touch targets, high contrast
   - Voice-first interaction
   - Passwordless auth (magic links, persistent cookies)
   - Primary actions: "Ask a Question" (mic) + "Scan a Problem" (camera)

2. **Family Dashboard** — Modern control center
   - Standard auth (email/password, SSO)
   - Activity feed, security alerts, subscription management
   - Receives push notifications for scam detection (>90% confidence)

### AI Safety Guardrails
- **Financial Firewall**: AI must NEVER provide instructions for money transfers, crypto purchases, or password sharing. Always escalate to family.
- **Hallucination Prevention**: RAG-only answers from whitelisted domains (Gov.uk, Apple Support, Medicare.gov). Unknown queries escalate to family.

## Tech Stack
- PWA (no app store friction)
- Vision AI: GPT-4o or Gemini 1.5 Pro
- RAG for verified tech support answers

## Development Phases
- **Phase 1 (MVP)**: "What is this?" camera + scam detection + family alerts
- **Phase 2**: Voice Q&A tech concierge + jargon buster

## Design Constraints
- Senior users are 75+; assume low tech literacy
- Login screens are #1 abandonment point — minimize auth friction
- No credit card entry for seniors — payment handled by family member
- All AI responses must be slow, one step at a time, with large visual cues

## Key Patterns

### Authentication (Better Auth)
- **Config**: `src/lib/auth.ts` (server), `src/lib/auth-client.ts` (client)
- **Route protection**: `src/middleware.ts`
- Uses `pg` Pool for Neon connection (not neon serverless driver)
- Better Auth tables in `public` schema: `user`, `session`, `account`, `verification`
- See `docs/AUTH.md` for full details

### Database (Drizzle + Neon)
- **Schema**: `src/lib/db/schema.ts`
- **Client**: `src/lib/db/index.ts`
- Two sets of tables: Better Auth tables + our custom tables (users, families, alerts, etc.)
- See `docs/DASHBOARD.md` for family/invite table schemas

### Role-Based Access Control
- User role stored in Better Auth `user.role` field ('senior' | 'family')
- Middleware blocks seniors from `/dashboard/*` routes
- API endpoints check `session.user.role` for authorization
- Dashboard nav items filtered by role in layout component

### CSS Variables (Theming)
- `--bg-deep`, `--bg-card`, `--bg-elevated` - backgrounds
- `--amber-glow`, `--amber-soft` - accent colors
- `--text-primary`, `--text-secondary`, `--text-muted` - text
- `--success`, `--error` - status colors

### Component Patterns
- Large touch targets (60px+ buttons) for senior view
- `.card`, `.btn`, `.btn-primary`, `.input-large` utility classes for senior view
- `.dash-card`, `.dash-btn-*`, `.dash-input` for dashboard (compact)
- `.dashboard-view` wrapper disables large touch targets
- Icons are inline SVG components
