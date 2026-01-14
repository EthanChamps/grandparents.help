import Link from 'next/link'
import { getAllPosts, getAllTags, type BlogPostMeta } from '@/lib/blog'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog | GuardRails - Senior Safety & Technology Tips',
  description:
    'Expert advice on protecting seniors from scams, technology tips for older adults, and guides for family caregivers. Stay informed with GuardRails.',
  openGraph: {
    title: 'GuardRails Blog - Senior Safety & Technology Tips',
    description:
      'Expert advice on protecting seniors from scams, technology tips for older adults, and guides for family caregivers.',
    type: 'website',
  },
}

export default function BlogPage() {
  const posts = getAllPosts()
  const tags = getAllTags()

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
          <Link href="/landing" className="flex items-center gap-2">
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
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/blog"
              className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold"
              style={{ color: 'var(--amber-glow)' }}
            >
              Blog
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

      {/* Hero with gradient */}
      <section
        className="relative px-4 sm:px-6 lg:px-8 py-16 sm:py-20 overflow-hidden"
        style={{ background: 'var(--bg-card)' }}
      >
        {/* Decorative gradient orbs */}
        <div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: 'var(--amber-glow)' }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-10"
          style={{ background: '#a855f7' }}
        />

        <div className="relative max-w-4xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
            }}
          >
            <BookIcon className="w-4 h-4" style={{ color: 'var(--amber-glow)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--amber-glow)' }}>
              Knowledge Centre
            </span>
          </div>

          <h1
            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold mb-4 sm:mb-6"
            style={{ color: 'var(--text-primary)' }}
          >
            Protect What{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, var(--amber-glow) 0%, #fcd34d 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Matters Most
            </span>
          </h1>
          <p
            className="text-base sm:text-xl max-w-2xl mx-auto leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            Expert guides on protecting seniors from scams, technology tips for older adults, and
            resources for family caregivers.
          </p>
        </div>
      </section>

      {/* Tags */}
      {tags.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
              {tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog/tag/${tag}`}
                  className="group px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105"
                  style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    color: 'var(--amber-glow)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                  }}
                >
                  <span className="opacity-60 group-hover:opacity-100 transition-opacity">#</span>
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Posts Grid */}
      <section className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg" style={{ color: 'var(--text-muted)' }}>
                No blog posts yet. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {posts.map((post, index) => (
                <BlogCard key={post.slug} post={post} featured={index === 0} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="relative px-4 sm:px-6 lg:px-8 py-16 sm:py-20 overflow-hidden"
        style={{ background: 'var(--bg-card)' }}
      >
        {/* Decorative elements */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, var(--amber-glow) 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative max-w-3xl mx-auto text-center">
          <div
            className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, var(--amber-glow) 0%, #d97706 100%)',
              boxShadow: '0 8px 32px rgba(245, 158, 11, 0.3)',
            }}
          >
            <ShieldIcon className="w-8 h-8" style={{ color: 'var(--bg-deep)' }} />
          </div>

          <h2
            className="text-2xl sm:text-3xl font-bold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            Ready to protect your family?
          </h2>
          <p
            className="text-base sm:text-lg mb-8 max-w-xl mx-auto"
            style={{ color: 'var(--text-secondary)' }}
          >
            Join thousands of families using GuardRails to keep their loved ones safe from scams.
          </p>
          <Link
            href="/auth/family"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl text-lg font-bold transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, var(--amber-glow) 0%, #d97706 100%)',
              color: 'var(--bg-deep)',
              boxShadow: '0 4px 20px rgba(245, 158, 11, 0.4)',
              minHeight: '60px',
            }}
          >
            Start Free Trial
            <ArrowRightIcon className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-4 sm:px-6 lg:px-8 py-8"
        style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}
      >
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            © 2026 GuardRails. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

function BlogCard({ post, featured }: { post: BlogPostMeta; featured?: boolean }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group">
      <article
        className={`h-full rounded-2xl transition-all duration-300 group-hover:-translate-y-2 overflow-hidden ${
          featured ? 'md:col-span-2' : ''
        }`}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
        }}
      >
        {/* Gradient header bar */}
        <div
          className="h-1"
          style={{
            background: 'linear-gradient(90deg, var(--amber-glow) 0%, #d97706 50%, transparent 100%)',
          }}
        />

        <div className="p-6 sm:p-8">
          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
                  style={{
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: 'var(--amber-glow)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h2
            className={`font-bold mb-3 leading-tight ${
              featured ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'
            }`}
            style={{ color: 'var(--text-primary)' }}
          >
            <span className="group-hover:underline decoration-2 underline-offset-4"
              style={{ textDecorationColor: 'var(--amber-glow)' }}>
              {post.title}
            </span>
          </h2>

          {/* Description */}
          <p
            className={`mb-6 leading-relaxed ${featured ? 'text-base' : 'text-sm'}`}
            style={{ color: 'var(--text-secondary)' }}
          >
            {post.description}
          </p>

          {/* Meta */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4" />
                {formatDate(post.date)}
              </span>
              <span className="flex items-center gap-1.5">
                <ClockIcon className="w-4 h-4" />
                {post.readingTime}
              </span>
            </div>

            <div
              className="flex items-center gap-1 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: 'var(--amber-glow)' }}
            >
              Read more
              <ArrowRightIcon className="w-4 h-4" />
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function ShieldIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
    </svg>
  )
}

function BookIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  )
}

function CalendarIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function ClockIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ArrowRightIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  )
}
