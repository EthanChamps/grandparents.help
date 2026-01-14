import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// Create neon client
const sql = neon(process.env.DATABASE_URL!)

// Create drizzle client with schema for relational queries
export const db = drizzle(sql, { schema })

// Re-export schema for convenience
export * from './schema'

// Re-export useful drizzle operators
export { eq, and, or, desc, asc, isNull, isNotNull } from 'drizzle-orm'
