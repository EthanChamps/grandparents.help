import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { getAllPostSlugs, getPostBySlug, getRelatedPosts } from '@/lib/blog'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = getAllPostSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) {
    return {
      title: 'Post Not Found | GuardRails Blog',
    }
  }

  return {
    title: `${post.title} | GuardRails Blog`,
    description: post.description,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
      images: post.image ? [post.image] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: post.image ? [post.image] : undefined,
    },
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const relatedPosts = getRelatedPosts(slug, 3)

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
              style={{ color: 'var(--text-secondary)' }}
            >
              ← Back to Blog
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

      {/* Article */}
      <article className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-6 sm:mb-8">
            <ol className="flex items-center gap-2 text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
              <li>
                <Link href="/landing" className="hover:underline">
                  Home
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/blog" className="hover:underline">
                  Blog
                </Link>
              </li>
              <li>/</li>
              <li style={{ color: 'var(--text-secondary)' }}>{post.title}</li>
            </ol>
          </nav>

          {/* Header */}
          <header className="mb-8 sm:mb-12">
            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/blog/tag/${tag}`}
                    className="px-3 py-1 rounded-full text-xs font-medium transition-all hover:scale-105"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--amber-glow)' }}
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Title */}
            <h1
              className="text-2xl sm:text-4xl lg:text-5xl font-extrabold mb-4 sm:mb-6 leading-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {post.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
              <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                {post.author}
              </span>
              <span>•</span>
              <span>{formatDate(post.date)}</span>
              <span>•</span>
              <span>{post.readingTime}</span>
            </div>
          </header>

          {/* Featured Image */}
          {post.image && (
            <div
              className="w-full h-64 sm:h-80 rounded-2xl mb-8 sm:mb-12 bg-cover bg-center"
              style={{ backgroundImage: `url(${post.image})` }}
            />
          )}

          {/* Content */}
          <div className="prose-custom">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-2xl sm:text-3xl font-bold mt-8 mb-4" style={{ color: 'var(--text-primary)' }}>
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl sm:text-2xl font-bold mt-8 mb-4" style={{ color: 'var(--text-primary)' }}>
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg sm:text-xl font-bold mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-base sm:text-lg leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-4 space-y-2" style={{ color: 'var(--text-secondary)' }}>
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-4 space-y-2" style={{ color: 'var(--text-secondary)' }}>
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-base sm:text-lg leading-relaxed">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold" style={{ color: 'var(--text-primary)' }}>
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="italic" style={{ color: 'var(--amber-soft)' }}>
                    {children}
                  </em>
                ),
                blockquote: ({ children }) => (
                  <blockquote
                    className="border-l-4 pl-4 my-6 italic"
                    style={{ borderColor: 'var(--amber-glow)', color: 'var(--text-secondary)' }}
                  >
                    {children}
                  </blockquote>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    className="underline font-medium hover:no-underline"
                    style={{ color: 'var(--amber-glow)' }}
                    target={href?.startsWith('http') ? '_blank' : undefined}
                    rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {children}
                  </a>
                ),
                code: ({ children }) => (
                  <code
                    className="px-1.5 py-0.5 rounded text-sm font-mono"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--amber-glow)' }}
                  >
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre
                    className="p-4 rounded-xl overflow-x-auto mb-4 text-sm"
                    style={{ background: 'var(--bg-elevated)' }}
                  >
                    {children}
                  </pre>
                ),
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>

          {/* Author Box */}
          <div
            className="mt-12 p-6 rounded-2xl"
            style={{ background: 'var(--bg-card)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--bg-elevated)' }}
              >
                <span className="text-xl font-bold" style={{ color: 'var(--amber-glow)' }}>
                  {post.author.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  {post.author}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Helping families stay safe online
                </p>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16" style={{ background: 'var(--bg-card)' }}>
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8" style={{ color: 'var(--text-primary)' }}>
              Related Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link key={relatedPost.slug} href={`/blog/${relatedPost.slug}`} className="group">
                  <article
                    className="h-full p-5 rounded-xl transition-all group-hover:-translate-y-1"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <h3
                      className="font-bold mb-2 group-hover:underline"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {relatedPost.title}
                    </h3>
                    <p className="text-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                      {relatedPost.description}
                    </p>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            Protect your family today
          </h2>
          <p className="text-sm sm:text-base mb-6" style={{ color: 'var(--text-secondary)' }}>
            GuardRails helps seniors stay safe from scams while keeping family informed.
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

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
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
