import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import readingTime from 'reading-time'

const BLOG_DIR = path.join(process.cwd(), 'content/blog')

export interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  author: string
  tags: string[]
  image?: string
  content: string
  readingTime: string
}

export interface BlogPostMeta {
  slug: string
  title: string
  description: string
  date: string
  author: string
  tags: string[]
  image?: string
  readingTime: string
}

/**
 * Get all blog post slugs for static generation
 */
export function getAllPostSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) {
    return []
  }

  const files = fs.readdirSync(BLOG_DIR)
  return files
    .filter((file) => file.endsWith('.md') || file.endsWith('.mdx'))
    .map((file) => file.replace(/\.mdx?$/, ''))
}

/**
 * Get a single blog post by slug
 */
export function getPostBySlug(slug: string): BlogPost | null {
  const mdPath = path.join(BLOG_DIR, `${slug}.md`)
  const mdxPath = path.join(BLOG_DIR, `${slug}.mdx`)

  let filePath = ''
  if (fs.existsSync(mdPath)) {
    filePath = mdPath
  } else if (fs.existsSync(mdxPath)) {
    filePath = mdxPath
  } else {
    return null
  }

  const fileContents = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(fileContents)
  const stats = readingTime(content)

  return {
    slug,
    title: data.title || 'Untitled',
    description: data.description || '',
    date: data.date || new Date().toISOString(),
    author: data.author || 'GuardRails Team',
    tags: data.tags || [],
    image: data.image,
    content,
    readingTime: stats.text,
  }
}

/**
 * Get all blog posts metadata (for listing page)
 */
export function getAllPosts(): BlogPostMeta[] {
  const slugs = getAllPostSlugs()
  const posts = slugs
    .map((slug) => {
      const post = getPostBySlug(slug)
      if (!post) return null

      // Return metadata only (no content)
      const { content: _, ...meta } = post
      return meta
    })
    .filter((post): post is BlogPostMeta => post !== null)

  // Sort by date (newest first)
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

/**
 * Get posts by tag
 */
export function getPostsByTag(tag: string): BlogPostMeta[] {
  const posts = getAllPosts()
  return posts.filter((post) => post.tags.includes(tag.toLowerCase()))
}

/**
 * Get all unique tags
 */
export function getAllTags(): string[] {
  const posts = getAllPosts()
  const tags = new Set<string>()
  posts.forEach((post) => post.tags.forEach((tag) => tags.add(tag)))
  return Array.from(tags).sort()
}

/**
 * Get related posts (by matching tags)
 */
export function getRelatedPosts(slug: string, limit = 3): BlogPostMeta[] {
  const currentPost = getPostBySlug(slug)
  if (!currentPost) return []

  const allPosts = getAllPosts()
  const otherPosts = allPosts.filter((post) => post.slug !== slug)

  // Score posts by matching tags
  const scored = otherPosts.map((post) => {
    const matchingTags = post.tags.filter((tag) => currentPost.tags.includes(tag))
    return { post, score: matchingTags.length }
  })

  // Sort by score (most matching tags first)
  scored.sort((a, b) => b.score - a.score)

  return scored.slice(0, limit).map((s) => s.post)
}
