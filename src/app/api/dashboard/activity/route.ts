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

    // Get the user's family ID from familyMembers table
    // For now, we'll return mock data since family linking isn't implemented yet
    // In production, we'd query based on family membership

    // Get linked seniors (users with role='senior' in the same family)
    // For MVP, return empty array - will be populated when family linking is built
    const activities: Array<{
      id: string
      type: 'message' | 'alert'
      content: string
      seniorName: string
      createdAt: string
      scamProbability?: number
    }> = []

    // TODO: Query actual data when family relationships are established
    // const familyData = await db.select()
    //   .from(familyMembers)
    //   .where(eq(familyMembers.userId, session.user.id))
    //   .limit(1)

    return NextResponse.json({ activities })
  } catch (error) {
    console.error('Dashboard activity error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    )
  }
}
