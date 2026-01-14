import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { guardianFamilies, alerts, familyMembers, messages, users } from '@/lib/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's family
    const guardianFamily = await db
      .select()
      .from(guardianFamilies)
      .where(eq(guardianFamilies.authUserId, session.user.id))
      .limit(1)

    if (guardianFamily.length === 0) {
      return NextResponse.json({ activities: [] })
    }

    const familyId = guardianFamily[0].familyId

    // Get recent alerts for this family
    const recentAlerts = await db
      .select({
        id: alerts.id,
        type: sql<string>`'alert'`,
        content: alerts.aiAnalysis,
        seniorName: users.name,
        createdAt: alerts.createdAt,
        scamProbability: alerts.scamProbability,
      })
      .from(alerts)
      .innerJoin(users, eq(alerts.userId, users.id))
      .where(eq(alerts.familyId, familyId))
      .orderBy(desc(alerts.createdAt))
      .limit(10)

    // Get recent messages from seniors in this family
    const recentMessages = await db
      .select({
        id: messages.id,
        type: sql<string>`'message'`,
        content: messages.content,
        seniorName: users.name,
        createdAt: messages.createdAt,
        scamProbability: sql<null>`null`,
      })
      .from(messages)
      .innerJoin(familyMembers, eq(messages.userId, familyMembers.userId))
      .innerJoin(users, eq(messages.userId, users.id))
      .where(and(
        eq(familyMembers.familyId, familyId),
        eq(familyMembers.role, 'senior'),
        eq(messages.role, 'user')
      ))
      .orderBy(desc(messages.createdAt))
      .limit(10)

    // Combine and sort by date
    const activities = [...recentAlerts, ...recentMessages]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(activity => ({
        id: activity.id,
        type: activity.type as 'message' | 'alert',
        content: activity.content || 'No content',
        seniorName: activity.seniorName || 'Unknown',
        createdAt: activity.createdAt.toISOString(),
        scamProbability: activity.scamProbability ? parseFloat(String(activity.scamProbability)) : undefined,
      }))

    return NextResponse.json({ activities })
  } catch (error) {
    console.error('Dashboard activity error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    )
  }
}
