import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { guardianFamilies, alerts, familyMembers, messages, familyInvites } from '@/lib/db/schema'
import { eq, and, sql, gte } from 'drizzle-orm'

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
      // User has no family yet - return zeros
      return NextResponse.json({
        totalAlerts: 0,
        unacknowledgedAlerts: 0,
        linkedSeniors: 0,
        recentQuestions: 0,
      })
    }

    const familyId = guardianFamily[0].familyId

    // Get alert counts
    const alertStats = await db
      .select({
        total: sql<number>`count(*)::int`,
        unacknowledged: sql<number>`sum(case when ${alerts.acknowledged} = false then 1 else 0 end)::int`,
      })
      .from(alerts)
      .where(eq(alerts.familyId, familyId))

    // Get linked seniors count (from familyMembers where role='senior')
    const seniorCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(familyMembers)
      .where(and(
        eq(familyMembers.familyId, familyId),
        eq(familyMembers.role, 'senior')
      ))

    // Get pending invites count too
    const pendingInvites = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(familyInvites)
      .where(and(
        eq(familyInvites.familyId, familyId),
        eq(familyInvites.status, 'pending')
      ))

    // Get recent questions (messages from last 7 days from family seniors)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // For MVP, count all messages from family seniors in last 7 days
    // This requires joining through familyMembers to get senior user IDs
    const recentQuestions = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(messages)
      .innerJoin(familyMembers, eq(messages.userId, familyMembers.userId))
      .where(and(
        eq(familyMembers.familyId, familyId),
        eq(familyMembers.role, 'senior'),
        eq(messages.role, 'user'),
        gte(messages.createdAt, sevenDaysAgo)
      ))

    return NextResponse.json({
      totalAlerts: alertStats[0]?.total ?? 0,
      unacknowledgedAlerts: alertStats[0]?.unacknowledged ?? 0,
      linkedSeniors: (seniorCount[0]?.count ?? 0) + (pendingInvites[0]?.count ?? 0),
      recentQuestions: recentQuestions[0]?.count ?? 0,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
