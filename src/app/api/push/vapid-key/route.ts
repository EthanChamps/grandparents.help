import { NextResponse } from 'next/server'
import { getVapidPublicKey } from '@/lib/push'

export async function GET() {
  const vapidKey = getVapidPublicKey()

  if (!vapidKey) {
    return NextResponse.json(
      { error: 'Push notifications not configured' },
      { status: 503 }
    )
  }

  return NextResponse.json({ vapidKey })
}
