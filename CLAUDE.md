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
