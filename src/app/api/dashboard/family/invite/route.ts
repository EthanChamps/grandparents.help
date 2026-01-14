import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { guardianFamilies, families, familyInvites, familyMembers, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { Resend } from 'resend'
import { randomBytes } from 'crypto'

// Lazy init Resend
let resend: Resend | null = null
function getResend() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Seniors cannot send invites
    if (session.user.role === 'senior') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, phone } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (!email && !phone) {
      return NextResponse.json({ error: 'Email or phone is required' }, { status: 400 })
    }

    // Get or create family for this user
    let familyId: string

    const existingFamily = await db
      .select()
      .from(guardianFamilies)
      .where(eq(guardianFamilies.authUserId, session.user.id))
      .limit(1)

    if (existingFamily.length === 0) {
      // Create a new family
      const [newFamily] = await db
        .insert(families)
        .values({
          name: `${session.user.name || 'My'}'s Family`,
        })
        .returning({ id: families.id })

      familyId = newFamily.id

      // Link user to family as guardian
      await db.insert(guardianFamilies).values({
        authUserId: session.user.id,
        familyId: familyId,
        role: 'guardian',
      })
    } else {
      familyId = existingFamily[0].familyId
    }

    // Check for existing pending invite with same email/phone
    if (email) {
      const existingInvite = await db
        .select()
        .from(familyInvites)
        .where(and(
          eq(familyInvites.familyId, familyId),
          eq(familyInvites.email, email),
          eq(familyInvites.status, 'pending')
        ))
        .limit(1)

      if (existingInvite.length > 0) {
        return NextResponse.json(
          { error: 'An invite has already been sent to this email' },
          { status: 400 }
        )
      }
    }

    if (phone) {
      const existingInvite = await db
        .select()
        .from(familyInvites)
        .where(and(
          eq(familyInvites.familyId, familyId),
          eq(familyInvites.phone, phone),
          eq(familyInvites.status, 'pending')
        ))
        .limit(1)

      if (existingInvite.length > 0) {
        return NextResponse.json(
          { error: 'An invite has already been sent to this phone number' },
          { status: 400 }
        )
      }
    }

    // Check if already a family member
    if (email) {
      const existingMember = await db
        .select()
        .from(familyMembers)
        .innerJoin(users, eq(familyMembers.userId, users.id))
        .where(and(
          eq(familyMembers.familyId, familyId),
          eq(users.email, email)
        ))
        .limit(1)

      if (existingMember.length > 0) {
        return NextResponse.json(
          { error: 'This person is already a family member' },
          { status: 400 }
        )
      }
    }

    // Generate invite token
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Expires in 7 days

    // Create invite record
    await db.insert(familyInvites).values({
      familyId,
      invitedBy: session.user.id,
      name,
      email: email || null,
      phone: phone || null,
      token,
      expiresAt,
    })

    // Send invite email if email provided
    if (email) {
      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/senior?token=${token}`

      try {
        await getResend().emails.send({
          from: 'GuardRails <noreply@kingshotauto.com>',
          to: email,
          subject: `${session.user.name || 'A family member'} invited you to GuardRails`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="text-align: center; margin-bottom: 40px;">
                <h1 style="color: #f59e0b; font-size: 32px; margin: 0;">GuardRails</h1>
                <p style="color: #6b7280; font-size: 16px; margin-top: 8px;">Your Family's Safety Companion</p>
              </div>

              <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 16px;">
                Hi ${name}! 👋
              </h2>

              <p style="color: #374151; font-size: 18px; line-height: 1.6; margin-bottom: 24px;">
                <strong>${session.user.name || 'A family member'}</strong> wants to help keep you safe online.
                GuardRails helps you identify scams and get quick answers to tech questions.
              </p>

              <div style="text-align: center; margin: 40px 0;">
                <a href="${inviteUrl}"
                   style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                          color: white; padding: 20px 48px; font-size: 20px; font-weight: bold;
                          text-decoration: none; border-radius: 12px;
                          box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);">
                  Get Started
                </a>
              </div>

              <p style="color: #6b7280; font-size: 14px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                This invite link expires in 7 days. If you didn't expect this invitation, you can safely ignore it.
              </p>
            </div>
          `,
        })
      } catch (emailError) {
        console.error('Failed to send invite email:', emailError)
        // Don't fail the request - invite is still created
      }
    }

    // SMS invites not yet implemented - requires Twilio integration
    // When implemented: send SMS to ${phone} with invite link containing ${token}

    return NextResponse.json({
      success: true,
      message: email ? 'Invite email sent' : 'Invite created (SMS not yet implemented)',
    })
  } catch (error) {
    console.error('Family invite error:', error)
    return NextResponse.json(
      { error: 'Failed to send invite' },
      { status: 500 }
    )
  }
}
