# GuardRails — The Family-Integrated Digital Concierge

> "Peace of mind for you, independence for them."

## Overview

A Family Defense Platform targeting the "Sandwich Generation" (adults caring for both children and aging parents). Solves two pain points:
1. Adult children acting as 24/7 tech support
2. Fear of parents losing savings to fraud

**Platform**: Web App (PWA) — no app store friction for seniors

---

## 1. Dual-Interface Architecture

| Aspect | Interface A: Senior View | Interface B: Family Dashboard |
|--------|--------------------------|-------------------------------|
| Design | Radical Simplicity (WCAG AAA). High contrast, 60px+ buttons, voice-first | Modern Control Center. Data-rich, notifications, subscription mgmt |
| Primary Action | Giant mic button ("Ask a Question") + Camera ("Scan a Problem") | Activity feed + Security Alerts |
| Auth | Passwordless. Magic Link or persistent cookie | Standard email/password or SSO |

---

## 2. Onboarding Strategy

### Path A: Family Champion Setup (Primary)
Target: Adult child (45-60) who buys subscription

1. **Purchase**: Child creates Family Account, pays subscription ($15-$25/month)
2. **Profile Setup**: Parent's name, device type, "Safe Contacts" (family numbers)
3. **Magic Handoff**:
   - *Remote*: SMS with magic link to parent
   - *In-Person*: QR code scan from child's phone

### Path B: Independent Senior Sign-up
Target: Tech-curious senior (70+)

1. Voice-guided intake with video explainer
2. Phone number only → 4-digit SMS code
3. **No credit card upfront** — 7-day trial or bill family member via SMS

---

## 3. Feature Roadmap

### Phase 1: "Safe Vision" MVP (Months 1-3)

#### The "What is this?" Camera
- Senior points camera at letter, screen, or object
- AI (GPT-4o / Gemini 1.5 Pro Vision) analyzes image
- Outputs:
  - **Safe**: "This is a restaurant menu. It is safe."
  - **Scam**: "Warning: This letter claims you won a lottery, but it is a known scam. Do not call the number."

#### Family Alert Loop
- Scam probability >90% → Push notification to Family Dashboard
- Example: "Alert: Dad just scanned a suspicious IRS letter."

### Phase 2: "Tech Concierge" (Months 4-6)

#### Voice-First Q&A
- Senior asks: "How do I send a picture on WhatsApp?"
- AI uses RAG from curated device manuals
- Reads answer slowly, displays one step at a time with big arrows

#### Jargon Buster
- Plain-English explanations: "What is 2FA?", "What is the Cloud?"

---

## 4. Safety Guardrails

### Financial Firewall
- AI **never** provides instructions for:
  - Transferring money
  - Buying crypto
  - Sharing passwords
- Trigger response: "For your safety, I cannot help with bank transfers. Would you like me to call [family member] for you?"

### Hallucination Prevention (RAG)
- Only answers from whitelist of verified domains (Gov.uk, Apple Support, Medicare.gov)
- Unknown queries → escalate to family member

---

## 5. Pricing Model

### "Peace of Mind" Subscription
- **$19/month** or **$180/year**
- Selling point: 5 hours/month back + inheritance protection

### Freemium Tiers
| Free | Paid |
|------|------|
| Basic Q&A ("How do I use Zoom?") | Visual Scam Detector |
| | Family Alerts |
| | Personal Tech Support |

### Cost Justification (Trust Signal)
- AI API costs (Vision + Voice)
- "We charge because we don't sell your data"

---

## 6. Development Timeline

| Phase | Milestone | Deliverable |
|-------|-----------|-------------|
| Month 1 | Prototype | Vision Analyzer with OpenAI API. Test with 5 seniors (75+) |
| Month 2 | Family Dashboard | Web portal for Trusted Contacts + alerts |
| Month 3 | Guardrails | RAG on scam scripts, financial refusal prompts |
| Month 4 | Beta | 50 families, measure false positives |
| Month 6 | Launch | Marketing to Sandwich Generation (Facebook/LinkedIn) |

---

## 7. Immediate Next Step

**Build a "Wizard of Oz" Prototype**

1. Simple landing page where senior uploads photo of "problem"
2. Human responds via text within 5 minutes
3. **Goal**: Test if seniors can actually take and send a photo
4. If camera hardware is a struggle → redesign with video tutorials
