import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { userSettings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// GET - Fetch user settings
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user settings
    const settings = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, session.user.id))
      .limit(1)

    if (settings.length === 0) {
      // Return defaults if no settings exist
      return NextResponse.json({
        emailAlerts: true,
        pushNotifications: true,
        smsAlerts: false,
        alertThreshold: 'high',
      })
    }

    return NextResponse.json({
      emailAlerts: settings[0].emailAlerts,
      pushNotifications: settings[0].pushNotifications,
      smsAlerts: settings[0].smsAlerts,
      alertThreshold: settings[0].alertThreshold,
    })
  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// POST - Update user settings
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { emailAlerts, pushNotifications, smsAlerts, alertThreshold } = body

    // Validate alertThreshold
    if (alertThreshold && !['all', 'high', 'critical'].includes(alertThreshold)) {
      return NextResponse.json({ error: 'Invalid alert threshold' }, { status: 400 })
    }

    // Upsert settings
    const existingSettings = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, session.user.id))
      .limit(1)

    if (existingSettings.length === 0) {
      // Insert new settings
      await db.insert(userSettings).values({
        userId: session.user.id,
        emailAlerts: emailAlerts ?? true,
        pushNotifications: pushNotifications ?? true,
        smsAlerts: smsAlerts ?? false,
        alertThreshold: alertThreshold ?? 'high',
      })
    } else {
      // Update existing settings
      await db
        .update(userSettings)
        .set({
          emailAlerts: emailAlerts ?? existingSettings[0].emailAlerts,
          pushNotifications: pushNotifications ?? existingSettings[0].pushNotifications,
          smsAlerts: smsAlerts ?? existingSettings[0].smsAlerts,
          alertThreshold: alertThreshold ?? existingSettings[0].alertThreshold,
          updatedAt: new Date(),
        })
        .where(eq(userSettings.userId, session.user.id))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
