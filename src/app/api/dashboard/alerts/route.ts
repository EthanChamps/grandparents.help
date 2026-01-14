import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { guardianFamilies, alerts, users } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

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
      return NextResponse.json({ alerts: [] })
    }

    const familyId = guardianFamily[0].familyId

    // Get all alerts for this family with senior name
    const familyAlerts = await db
      .select({
        id: alerts.id,
        type: alerts.type,
        seniorName: users.name,
        scamProbability: alerts.scamProbability,
        aiAnalysis: alerts.aiAnalysis,
        imageUrl: alerts.imageUrl,
        acknowledged: alerts.acknowledged,
        createdAt: alerts.createdAt,
      })
      .from(alerts)
      .innerJoin(users, eq(alerts.userId, users.id))
      .where(eq(alerts.familyId, familyId))
      .orderBy(desc(alerts.createdAt))
      .limit(50)

    const formattedAlerts = familyAlerts.map(alert => ({
      id: alert.id,
      type: alert.type,
      seniorName: alert.seniorName || 'Unknown',
      scamProbability: alert.scamProbability ? parseFloat(String(alert.scamProbability)) : 0,
      aiAnalysis: alert.aiAnalysis || 'No analysis available',
      imageUrl: alert.imageUrl || undefined,
      acknowledged: alert.acknowledged,
      createdAt: alert.createdAt.toISOString(),
    }))

    return NextResponse.json({ alerts: formattedAlerts })
  } catch (error) {
    console.error('Dashboard alerts error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    )
  }
}
