import { db } from '@/lib/db'
import { usageQuotas } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const FREE_DAILY_LIMIT = 15

/**
 * Get today's date in YYYY-MM-DD format (UTC)
 */
function getTodayUTC(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Check if user has quota remaining and get current usage
 */
export async function checkQuota(authUserId: string): Promise<{
  allowed: boolean
  remaining: number
  limit: number
  used: number
}> {
  const today = getTodayUTC()

  // Get or create quota record
  const [existing] = await db
    .select()
    .from(usageQuotas)
    .where(eq(usageQuotas.authUserId, authUserId))
    .limit(1)

  if (!existing) {
    // New user, full quota available
    return {
      allowed: true,
      remaining: FREE_DAILY_LIMIT,
      limit: FREE_DAILY_LIMIT,
      used: 0,
    }
  }

  // Check if it's a new day - reset quota
  if (existing.lastQuestionDate !== today) {
    return {
      allowed: true,
      remaining: FREE_DAILY_LIMIT,
      limit: FREE_DAILY_LIMIT,
      used: 0,
    }
  }

  // Same day - check remaining quota
  const used = existing.questionCount
  const remaining = Math.max(0, FREE_DAILY_LIMIT - used)

  return {
    allowed: remaining > 0,
    remaining,
    limit: FREE_DAILY_LIMIT,
    used,
  }
}

/**
 * Increment usage after a successful question
 */
export async function incrementQuota(authUserId: string): Promise<{
  remaining: number
  limit: number
  used: number
}> {
  const today = getTodayUTC()

  // Get existing record
  const [existing] = await db
    .select()
    .from(usageQuotas)
    .where(eq(usageQuotas.authUserId, authUserId))
    .limit(1)

  if (!existing) {
    // Create new record with count = 1
    await db.insert(usageQuotas).values({
      authUserId,
      questionCount: 1,
      lastQuestionDate: today,
    })

    return {
      remaining: FREE_DAILY_LIMIT - 1,
      limit: FREE_DAILY_LIMIT,
      used: 1,
    }
  }

  // Check if it's a new day
  if (existing.lastQuestionDate !== today) {
    // Reset to 1 for new day
    await db
      .update(usageQuotas)
      .set({
        questionCount: 1,
        lastQuestionDate: today,
        updatedAt: new Date(),
      })
      .where(eq(usageQuotas.authUserId, authUserId))

    return {
      remaining: FREE_DAILY_LIMIT - 1,
      limit: FREE_DAILY_LIMIT,
      used: 1,
    }
  }

  // Same day - increment count
  const newCount = existing.questionCount + 1
  await db
    .update(usageQuotas)
    .set({
      questionCount: newCount,
      updatedAt: new Date(),
    })
    .where(eq(usageQuotas.authUserId, authUserId))

  return {
    remaining: Math.max(0, FREE_DAILY_LIMIT - newCount),
    limit: FREE_DAILY_LIMIT,
    used: newCount,
  }
}

/**
 * Get quota status without modifying
 */
export async function getQuota(authUserId: string): Promise<{
  remaining: number
  limit: number
  used: number
}> {
  const quota = await checkQuota(authUserId)
  return {
    remaining: quota.remaining,
    limit: quota.limit,
    used: quota.used,
  }
}
