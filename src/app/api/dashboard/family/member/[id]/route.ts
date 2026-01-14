import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { guardianFamilies, familyMembers } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// DELETE - Remove a family member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Seniors cannot remove family members
    if (session.user.role === 'senior') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: memberId } = await params

    // Can't remove yourself
    if (memberId === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot remove yourself from the family' },
        { status: 400 }
      )
    }

    // Get user's family
    const guardianFamily = await db
      .select()
      .from(guardianFamilies)
      .where(eq(guardianFamilies.authUserId, session.user.id))
      .limit(1)

    if (guardianFamily.length === 0) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 })
    }

    const familyId = guardianFamily[0].familyId

    // Delete the family member - only if they belong to user's family
    const result = await db
      .delete(familyMembers)
      .where(and(
        eq(familyMembers.userId, memberId),
        eq(familyMembers.familyId, familyId)
      ))
      .returning({ familyId: familyMembers.familyId })

    if (result.length === 0) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove member error:', error)
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    )
  }
}
