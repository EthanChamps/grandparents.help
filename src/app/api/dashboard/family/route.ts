import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { guardianFamilies, familyMembers, familyInvites, users } from '@/lib/db/schema'
import { eq, and, or, gt } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Seniors cannot access family management
    if (session.user.role === 'senior') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get user's family
    const guardianFamily = await db
      .select()
      .from(guardianFamilies)
      .where(eq(guardianFamilies.authUserId, session.user.id))
      .limit(1)

    if (guardianFamily.length === 0) {
      return NextResponse.json({ members: [] })
    }

    const familyId = guardianFamily[0].familyId

    // Get all active family members (guardians and seniors)
    const activeMembers = await db
      .select({
        id: familyMembers.userId,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: familyMembers.role,
        createdAt: familyMembers.createdAt,
      })
      .from(familyMembers)
      .innerJoin(users, eq(familyMembers.userId, users.id))
      .where(eq(familyMembers.familyId, familyId))

    // Get pending invites (not expired)
    const pendingInvites = await db
      .select({
        id: familyInvites.id,
        name: familyInvites.name,
        email: familyInvites.email,
        phone: familyInvites.phone,
        createdAt: familyInvites.createdAt,
      })
      .from(familyInvites)
      .where(and(
        eq(familyInvites.familyId, familyId),
        eq(familyInvites.status, 'pending'),
        gt(familyInvites.expiresAt, new Date())
      ))

    // Combine active members and pending invites
    const members = [
      // Current user as guardian
      {
        id: session.user.id,
        name: session.user.name || 'You',
        email: session.user.email,
        phone: undefined,
        role: 'guardian' as const,
        lastActive: new Date().toISOString(),
        status: 'active' as const,
      },
      // Other active members
      ...activeMembers
        .filter(m => m.id !== session.user.id)
        .map(member => ({
          id: member.id,
          name: member.name || 'Unknown',
          email: member.email || undefined,
          phone: member.phone || undefined,
          role: member.role as 'guardian' | 'senior',
          lastActive: member.createdAt.toISOString(),
          status: 'active' as const,
        })),
      // Pending invites
      ...pendingInvites.map(invite => ({
        id: invite.id,
        name: invite.name,
        email: invite.email || undefined,
        phone: invite.phone || undefined,
        role: 'senior' as const,
        lastActive: undefined,
        status: 'pending' as const,
      })),
    ]

    return NextResponse.json({ members })
  } catch (error) {
    console.error('Dashboard family error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch family members' },
      { status: 500 }
    )
  }
}
