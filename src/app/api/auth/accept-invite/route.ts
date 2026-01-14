import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { familyInvites, familyMembers, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { Pool } from 'pg'
import { captureMagicLinkUrl } from '@/lib/auth'

// Direct pool for Better Auth user table operations
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// GET - Validate invite token and return invite details
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Find invite (pending or already accepted - allow re-use of link)
    const invite = await db
      .select()
      .from(familyInvites)
      .where(eq(familyInvites.token, token))
      .limit(1)

    if (invite.length === 0) {
      return NextResponse.json(
        { error: 'Invalid invite link' },
        { status: 404 }
      )
    }

    // Check if expired (only for pending invites)
    if (invite[0].status === 'pending' && invite[0].expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'This invite has expired' },
        { status: 410 }
      )
    }

    return NextResponse.json({
      valid: true,
      name: invite[0].name,
      email: invite[0].email,
      phone: invite[0].phone,
      alreadyAccepted: invite[0].status === 'accepted',
    })
  } catch (error) {
    console.error('Invite validation error:', error)
    return NextResponse.json(
      { error: 'Failed to validate invite' },
      { status: 500 }
    )
  }
}

// POST - Accept invite and create senior account (or sign in if already accepted)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, email } = body

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Find invite (pending or already accepted)
    const invite = await db
      .select()
      .from(familyInvites)
      .where(eq(familyInvites.token, token))
      .limit(1)

    if (invite.length === 0) {
      return NextResponse.json(
        { error: 'Invalid invite link' },
        { status: 404 }
      )
    }

    // Check if expired (only for pending invites)
    if (invite[0].status === 'pending' && invite[0].expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'This invite has expired' },
        { status: 410 }
      )
    }

    const inviteData = invite[0]
    const seniorEmail = email || inviteData.email

    if (!seniorEmail) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if Better Auth user already exists
    const existingAuthUser = await pool.query(
      'SELECT id FROM "user" WHERE email = $1 LIMIT 1',
      [seniorEmail]
    )

    let authUserId: string

    if (existingAuthUser.rows.length === 0) {
      // Create Better Auth user (required for magic link to work)
      const newAuthUser = await pool.query(
        `INSERT INTO "user" (id, email, name, "emailVerified", "createdAt", "updatedAt", role)
         VALUES (gen_random_uuid(), $1, $2, false, NOW(), NOW(), 'senior')
         RETURNING id`,
        [seniorEmail, inviteData.name]
      )
      authUserId = newAuthUser.rows[0].id
    } else {
      authUserId = existingAuthUser.rows[0].id
    }

    // Check if user already exists in our custom users table
    let seniorUser = await db
      .select()
      .from(users)
      .where(eq(users.email, seniorEmail))
      .limit(1)

    let seniorUserId: string

    if (seniorUser.length === 0) {
      // Create new senior user in our custom table
      const [newUser] = await db
        .insert(users)
        .values({
          type: 'senior',
          email: seniorEmail,
          phone: inviteData.phone,
          name: inviteData.name,
        })
        .returning({ id: users.id })

      seniorUserId = newUser.id
    } else {
      seniorUserId = seniorUser[0].id
    }

    // Check if already a family member
    const existingMembership = await db
      .select()
      .from(familyMembers)
      .where(and(
        eq(familyMembers.familyId, inviteData.familyId),
        eq(familyMembers.userId, seniorUserId)
      ))
      .limit(1)

    if (existingMembership.length === 0) {
      // Link senior to family
      await db.insert(familyMembers).values({
        familyId: inviteData.familyId,
        userId: seniorUserId,
        role: 'senior',
      })
    }

    // Mark invite as accepted (only if still pending)
    if (inviteData.status === 'pending') {
      await db
        .update(familyInvites)
        .set({ status: 'accepted' })
        .where(eq(familyInvites.id, inviteData.id))
    }

    // Generate a real magic link URL using Better Auth's API
    // This captures the URL that would normally be sent via email
    try {
      const magicLinkUrl = await captureMagicLinkUrl(seniorEmail, '/')

      return NextResponse.json({
        success: true,
        email: seniorEmail,
        name: inviteData.name,
        redirectTo: magicLinkUrl,
      })
    } catch (magicLinkError) {
      console.error('Magic link generation error:', magicLinkError)
      // Fallback: user will need to request magic link manually
      return NextResponse.json({
        success: true,
        email: seniorEmail,
        name: inviteData.name,
        needsMagicLink: true,
      })
    }
  } catch (error) {
    console.error('Invite acceptance error:', error)
    return NextResponse.json(
      { error: 'Failed to accept invite' },
      { status: 500 }
    )
  }
}
