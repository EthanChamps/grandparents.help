import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { guardianFamilies, familyInvites } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// DELETE - Cancel a pending invite
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

    // Seniors cannot manage invites
    if (session.user.role === 'senior') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: inviteId } = await params

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

    // Delete the invite - only if it belongs to user's family and is pending
    const result = await db
      .delete(familyInvites)
      .where(and(
        eq(familyInvites.id, inviteId),
        eq(familyInvites.familyId, familyId),
        eq(familyInvites.status, 'pending')
      ))
      .returning({ id: familyInvites.id })

    if (result.length === 0) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cancel invite error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel invite' },
      { status: 500 }
    )
  }
}
