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

      {/* Hero */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16" style={{ background: 'var(--bg-card)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h1
            className="text-2xl sm:text-4xl lg:text-5xl font-extrabold mb-3 sm:mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            GuardRails Blog
          </h1>
          <p className="text-sm sm:text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Expert advice on protecting seniors from scams, technology tips for older adults, and guides
            for family caregivers.
          </p>
        </div>
      </section>

      {/* Tags */}
      {tags.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap gap-2 justify-center">
              {tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog/tag/${tag}`}
                  className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all hover:scale-105"
                  style={{
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-secondary)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  #{tag}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16" style={{ background: 'var(--bg-card)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            Ready to protect your family?
          </h2>
          <p className="text-sm sm:text-base mb-6" style={{ color: 'var(--text-secondary)' }}>
            Join thousands of families using GuardRails to keep their loved ones safe.
          </p>
          <Link
            href="/auth/family"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold transition-all"
            style={{
              background: 'var(--amber-glow)',
              color: 'var(--bg-deep)',
              minHeight: '56px',
            }}
          >
            Start Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-4 sm:px-6 lg:px-8 py-8"
        style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}
      >
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            © 2026 GuardRails. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

function BlogCard({ post }: { post: BlogPostMeta }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group">
      <article
        className="h-full p-5 sm:p-6 rounded-2xl transition-all group-hover:-translate-y-1"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        {/* Image placeholder */}
        {post.image && (
          <div
            className="w-full h-40 rounded-xl mb-4 bg-cover bg-center"
            style={{ backgroundImage: `url(${post.image})` }}
          />
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{ background: 'var(--bg-elevated)', color: 'var(--amber-glow)' }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h2
          className="text-lg font-bold mb-2 group-hover:underline"
          style={{ color: 'var(--text-primary)' }}
        >
          {post.title}
        </h2>

        {/* Description */}
        <p
          className="text-sm mb-4 line-clamp-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          {post.description}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>{formatDate(post.date)}</span>
          <span>•</span>
          <span>{post.readingTime}</span>
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
