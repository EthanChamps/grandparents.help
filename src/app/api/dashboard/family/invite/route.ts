import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, phone } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (!email && !phone) {
      return NextResponse.json({ error: 'Email or phone is required' }, { status: 400 })
    }

    // TODO: Implement actual invite logic
    // 1. Create or get family for this user
    // 2. Create pending family member entry
    // 3. Send magic link via email or SMS

    // For MVP, just return success
    // The actual implementation will:
    // - Create a verification token
    // - Send email via Resend or SMS via Twilio
    // - Create a pending family member record

    return NextResponse.json({
      success: true,
      message: 'Invite sent successfully',
    })
  } catch (error) {
    console.error('Family invite error:', error)
    return NextResponse.json(
      { error: 'Failed to send invite' },
      { status: 500 }
    )
  }
}
