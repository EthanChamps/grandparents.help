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

    // For MVP, return empty members array
    // Real family members will be populated when family linking is implemented
    const members: Array<{
      id: string
      name: string
      email?: string
      phone?: string
      role: 'guardian' | 'senior'
      lastActive?: string
      status: 'active' | 'pending'
    }> = []

    // TODO: Query actual family members
    // const familyData = await db.select()
    //   .from(familyMembers)
    //   .innerJoin(users, eq(familyMembers.userId, users.id))
    //   .where(eq(familyMembers.familyId, userFamilyId))

    return NextResponse.json({ members })
  } catch (error) {
    console.error('Dashboard family error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch family members' },
      { status: 500 }
    )
  }
}
