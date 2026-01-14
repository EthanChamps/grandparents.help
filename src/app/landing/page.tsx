import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-deep)' }}>
      {/* Navigation */}
      <header
        className="sticky top-0 z-50 px-4 sm:px-6 lg:px-8"
        style={{
          background: 'rgba(26, 21, 32, 0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div className="max-w-6xl mx-auto h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, var(--amber-glow) 0%, #d97706 100%)',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
              }}
            >
              <ShieldIcon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: 'var(--bg-deep)' }} />
            </div>
            <span className="text-lg sm:text-xl font-extrabold" style={{ color: 'var(--amber-glow)' }}>
              GuardRails
            </span>
          </div>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/auth/senior"
              className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all"
              style={{ color: 'var(--text-secondary)' }}
            >
              Senior Sign In
            </Link>
            <Link
              href="/auth/family"
              className="px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all"
              style={{
                background: 'var(--amber-glow)',
                color: 'var(--bg-deep)',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section
        className="relative px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-20 sm:pb-32 overflow-hidden"
        style={{
          background: `
            radial-gradient(ellipse at 30% 0%, rgba(245, 158, 11, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 100%, rgba(168, 85, 247, 0.05) 0%, transparent 50%)
          `,
        }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 sm:mb-8"
            style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(245, 158, 11, 0.2)' }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--success)' }} />
            <span className="text-xs sm:text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Protecting families across the UK & US
            </span>
          </div>

          <h1
            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold mb-4 sm:mb-6 leading-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Peace of mind for you,
            <br />
            <span style={{ color: 'var(--amber-glow)' }}>independence for them.</span>
          </h1>

          <p
            className="text-base sm:text-xl lg:text-2xl mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            GuardRails helps seniors stay safe online while keeping family in the loop when it matters most.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              href="/auth/family"
              className="px-8 py-4 sm:py-5 rounded-2xl text-base sm:text-lg font-bold transition-all flex items-center justify-center gap-2"
              style={{
                background: 'var(--amber-glow)',
                color: 'var(--bg-deep)',
                minHeight: '60px',
                boxShadow: '0 4px 24px rgba(245, 158, 11, 0.3)',
              }}
            >
              Start Protecting Your Family
              <ArrowIcon className="w-5 h-5" />
            </Link>
            <Link
              href="/auth/senior"
              className="px-8 py-4 sm:py-5 rounded-2xl text-base sm:text-lg font-bold transition-all flex items-center justify-center"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                minHeight: '60px',
                border: '2px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              I&apos;m a Senior
            </Link>
          </div>
        </div>

        {/* Decorative elements */}
        <div
          className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)' }}
        />
      </section>

      {/* Problem Statement */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16" style={{ background: 'var(--bg-card)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <p
            className="text-xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4"
            style={{ color: 'var(--amber-glow)' }}
          >
            Every 40 seconds, a senior becomes a fraud target.
          </p>
          <p className="text-sm sm:text-lg" style={{ color: 'var(--text-secondary)' }}>
            In 2024, seniors lost over <strong style={{ color: 'var(--text-primary)' }}>$4.8 billion</strong> to scams.
            Most never tell their families until it&apos;s too late.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              How GuardRails Protects Your Family
            </h2>
            <p className="text-sm sm:text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              AI-powered protection that&apos;s simple enough for seniors, comprehensive enough for peace of mind.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <FeatureCard
              icon={<ShieldCheckIcon className="w-7 h-7" />}
              title="AI Scam Detection"
              description="Analyzes conversations and images for fraud patterns in real-time"
              highlight
            />
            <FeatureCard
              icon={<BellIcon className="w-7 h-7" />}
              title="Instant Family Alerts"
              description="Get notified immediately when suspicious activity is detected"
            />
            <FeatureCard
              icon={<ChatIcon className="w-7 h-7" />}
              title="Tech Q&A Support"
              description="Simple answers to any technology question, explained in plain English"
            />
            <FeatureCard
              icon={<CameraIcon className="w-7 h-7" />}
              title="Visual Scanner"
              description="Point camera at suspicious emails or popups for instant analysis"
            />
          </div>
        </div>
      </section>

      {/* Dual Interface Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24" style={{ background: 'var(--bg-card)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              Two Interfaces, One Family
            </h2>
            <p className="text-sm sm:text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Each family member gets an experience designed specifically for their needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Senior Interface */}
            <div
              className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6"
                style={{ background: 'linear-gradient(135deg, var(--amber-glow) 0%, #d97706 100%)' }}
              >
                <UserIcon className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: 'var(--bg-deep)' }} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3" style={{ color: 'var(--amber-glow)' }}>
                For Seniors
              </h3>
              <p className="text-sm sm:text-base mb-4 sm:mb-6" style={{ color: 'var(--text-secondary)' }}>
                Radically simple interface designed for ages 75+
              </p>
              <ul className="space-y-3">
                <FeatureListItem text="Extra-large buttons (60px+ touch targets)" />
                <FeatureListItem text="Voice input - just speak your question" />
                <FeatureListItem text="Answers read aloud automatically" />
                <FeatureListItem text="No passwords - magic link sign in" />
                <FeatureListItem text="High contrast, senior-friendly design" />
              </ul>
            </div>

            {/* Family Interface */}
            <div
              className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6"
                style={{ background: 'var(--bg-card)', border: '2px solid var(--amber-glow)' }}
              >
                <UsersIcon className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: 'var(--amber-glow)' }} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3" style={{ color: 'var(--text-primary)' }}>
                For Family Members
              </h3>
              <p className="text-sm sm:text-base mb-4 sm:mb-6" style={{ color: 'var(--text-secondary)' }}>
                Comprehensive dashboard to stay informed and in control
              </p>
              <ul className="space-y-3">
                <FeatureListItem text="Real-time scam alerts via push notification" />
                <FeatureListItem text="Activity feed - see what questions are being asked" />
                <FeatureListItem text="Manage multiple family members" />
                <FeatureListItem text="Notification preferences and thresholds" />
                <FeatureListItem text="Weekly digest emails (coming soon)" />
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24" id="pricing">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              Simple, Honest Pricing
            </h2>
            <p className="text-sm sm:text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              A fraction of what competitors charge. Phonely costs $37/mo, teleCalm costs $66/mo.
              <br />
              <strong style={{ color: 'var(--amber-glow)' }}>We charge fairly because we don&apos;t sell your data.</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <div
              className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div className="mb-6 sm:mb-8">
                <h3 className="text-lg sm:text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Free
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Try it out, no card required
                </p>
              </div>
              <div className="mb-6 sm:mb-8">
                <span className="text-4xl sm:text-5xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
                  $0
                </span>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <PricingFeature included text="15 questions per day" />
                <PricingFeature included text="Text-based scam detection" />
                <PricingFeature included text="Basic tech Q&A support" />
                <PricingFeature text="Camera/image analysis" />
                <PricingFeature text="Family alerts" />
                <PricingFeature text="Push notifications" />
              </ul>
              <Link
                href="/auth/senior"
                className="block w-full py-4 rounded-xl text-center font-bold transition-all"
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  minHeight: '56px',
                }}
              >
                Start Free
              </Link>
            </div>

            {/* Paid Tier */}
            <div
              className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl relative"
              style={{
                background: 'var(--bg-card)',
                border: '2px solid var(--amber-glow)',
                boxShadow: '0 0 40px rgba(245, 158, 11, 0.15)',
              }}
            >
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold"
                style={{ background: 'var(--amber-glow)', color: 'var(--bg-deep)' }}
              >
                RECOMMENDED
              </div>
              <div className="mb-6 sm:mb-8">
                <h3 className="text-lg sm:text-xl font-bold mb-1" style={{ color: 'var(--amber-glow)' }}>
                  Family Protection
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Complete peace of mind
                </p>
              </div>
              <div className="mb-6 sm:mb-8">
                <span className="text-4xl sm:text-5xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
                  $19
                </span>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>/month</span>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  or $180/year (save 20%)
                </p>
              </div>
              <ul className="space-y-3 mb-8">
                <PricingFeature included text="Unlimited questions" />
                <PricingFeature included text="Advanced scam detection" />
                <PricingFeature included text="Camera/image analysis" />
                <PricingFeature included text="Instant family alerts" />
                <PricingFeature included text="Push notifications" />
                <PricingFeature included text="Priority support" />
              </ul>
              <Link
                href="/auth/family"
                className="block w-full py-4 rounded-xl text-center font-bold transition-all"
                style={{
                  background: 'var(--amber-glow)',
                  color: 'var(--bg-deep)',
                  minHeight: '56px',
                }}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-20" style={{ background: 'var(--bg-card)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mb-10 sm:mb-12">
            <TrustBadge icon={<LockIcon className="w-5 h-5" />} text="Privacy First" />
            <TrustBadge icon={<ShieldIcon className="w-5 h-5" />} text="No Data Selling" />
            <TrustBadge icon={<CheckIcon className="w-5 h-5" />} text="WCAG AAA Accessible" />
          </div>

          <blockquote className="text-center">
            <p
              className="text-base sm:text-xl lg:text-2xl italic mb-4"
              style={{ color: 'var(--text-secondary)' }}
            >
              &ldquo;Mum finally feels confident using her phone, and I sleep better knowing I&apos;ll be alerted if something seems off.&rdquo;
            </p>
            <cite className="text-sm font-semibold" style={{ color: 'var(--amber-glow)' }}>
              — Sarah T., daughter and guardian
            </cite>
          </blockquote>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <h2
            className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6"
            style={{ color: 'var(--text-primary)' }}
          >
            Ready to protect your family?
          </h2>
          <p className="text-sm sm:text-lg mb-8 sm:mb-10" style={{ color: 'var(--text-secondary)' }}>
            Start free. No credit card required for seniors. Family members manage billing.
          </p>
          <Link
            href="/auth/family"
            className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl text-lg font-bold transition-all"
            style={{
              background: 'var(--amber-glow)',
              color: 'var(--bg-deep)',
              minHeight: '64px',
              boxShadow: '0 4px 24px rgba(245, 158, 11, 0.3)',
            }}
          >
            Get Started Free
            <ArrowIcon className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12"
        style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ShieldIcon className="w-5 h-5" style={{ color: 'var(--amber-glow)' }} />
              <span className="font-bold" style={{ color: 'var(--text-secondary)' }}>
                GuardRails
              </span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-sm hover:underline" style={{ color: 'var(--text-muted)' }}>
                Privacy
              </Link>
              <Link href="#" className="text-sm hover:underline" style={{ color: 'var(--text-muted)' }}>
                Terms
              </Link>
              <Link
                href="mailto:support@guardrails.help"
                className="text-sm hover:underline"
                style={{ color: 'var(--text-muted)' }}
              >
                Contact
              </Link>
            </div>
          </div>
          <p className="text-center mt-6 text-xs" style={{ color: 'var(--text-muted)' }}>
            © 2026 GuardRails. All rights reserved. Made with care for families everywhere.
          </p>
        </div>
      </footer>
    </div>
  )
}

/* Components */
function FeatureCard({
  icon,
  title,
  description,
  highlight = false,
}: {
  icon: React.ReactNode
  title: string
  description: string
  highlight?: boolean
}) {
  return (
    <div
      className="p-5 sm:p-6 rounded-2xl transition-all hover:-translate-y-1"
      style={{
        background: 'var(--bg-card)',
        border: highlight ? '2px solid var(--amber-glow)' : '1px solid rgba(255, 255, 255, 0.06)',
        boxShadow: highlight ? '0 0 30px rgba(245, 158, 11, 0.1)' : 'none',
      }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{
          background: highlight ? 'var(--amber-glow)' : 'var(--bg-elevated)',
          color: highlight ? 'var(--bg-deep)' : 'var(--amber-glow)',
        }}
      >
        {icon}
      </div>
      <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        {description}
      </p>
    </div>
  )
}

function FeatureListItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <CheckIcon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--success)' }} />
      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        {text}
      </span>
    </li>
  )
}

function PricingFeature({ text, included = false }: { text: string; included?: boolean }) {
  return (
    <li className="flex items-center gap-3">
      {included ? (
        <CheckIcon className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--success)' }} />
      ) : (
        <XIcon className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
      )}
      <span
        className="text-sm"
        style={{ color: included ? 'var(--text-secondary)' : 'var(--text-muted)' }}
      >
        {text}
      </span>
    </li>
  )
}

function TrustBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-2 rounded-full"
      style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
    >
      <span style={{ color: 'var(--amber-glow)' }}>{icon}</span>
      <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
        {text}
      </span>
    </div>
  )
}

/* Icons */
function ShieldIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
    </svg>
  )
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
    </svg>
  )
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  )
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
    </svg>
  )
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 15.2c1.87 0 3.4-1.52 3.4-3.4 0-1.87-1.53-3.4-3.4-3.4-1.88 0-3.4 1.53-3.4 3.4 0 1.88 1.52 3.4 3.4 3.4zm8-10.8H16l-1.5-1.6c-.32-.34-.78-.5-1.24-.5h-2.52c-.46 0-.92.17-1.24.5L8 4.4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-12c0-1.1-.9-2-2-2zm-8 13.2c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
    </svg>
  )
}

function UserIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  )
}

function UsersIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  )
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
    </svg>
  )
}

function CheckIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function XIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  )
}
