import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { guardianFamilies, alerts } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(
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

    const { id: alertId } = await params

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

    // Update the alert - only if it belongs to user's family
    const result = await db
      .update(alerts)
      .set({ acknowledged: true })
      .where(and(
        eq(alerts.id, alertId),
        eq(alerts.familyId, familyId)
      ))
      .returning({ id: alerts.id })

    if (result.length === 0) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, alertId: result[0].id })
  } catch (error) {
    console.error('Alert acknowledge error:', error)
    return NextResponse.json(
      { error: 'Failed to acknowledge alert' },
      { status: 500 }
    )
  }
}
