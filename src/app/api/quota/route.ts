import { getQuota } from '@/lib/quota'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Please sign in to view quota' },
        { status: 401 }
      )
    }

    const quota = await getQuota(session.user.id)

    return NextResponse.json({
      remaining: quota.remaining,
      limit: quota.limit,
      used: quota.used,
    })
  } catch (error) {
    console.error('Error in /api/quota:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
