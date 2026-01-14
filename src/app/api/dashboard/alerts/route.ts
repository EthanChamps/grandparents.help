import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For MVP, return empty alerts array
    // Real alerts will be created when scam detection (#7) is implemented
    const alerts: Array<{
      id: string
      type: string
      seniorName: string
      scamProbability: number
      aiAnalysis: string
      imageUrl?: string
      acknowledged: boolean
      createdAt: string
    }> = []

    // TODO: Query actual alerts when family relationships are established
    // const familyData = await db.select()
    //   .from(familyMembers)
    //   .where(eq(familyMembers.userId, session.user.id))
    //   .limit(1)
    //
    // if (familyData.length > 0) {
    //   const familyAlerts = await db.select()
    //     .from(alerts)
    //     .where(eq(alerts.familyId, familyData[0].familyId))
    //     .orderBy(desc(alerts.createdAt))
    //     .limit(50)
    // }

    return NextResponse.json({ alerts })
  } catch (error) {
    console.error('Dashboard alerts error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    )
  }
}
