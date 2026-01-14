import webpush from 'web-push'
import { db } from '@/lib/db'
import { pushSubscriptions, guardianFamilies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Initialize VAPID keys - these should be set in environment variables
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@grandparents.help'

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

export interface PushPayload {
  title: string
  body: string
  tag?: string
  url?: string
}

// Send push notification to a specific user
export async function sendPushToUser(authUserId: string, payload: PushPayload): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('VAPID keys not configured, skipping push notification')
    return
  }

  const subscriptions = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.authUserId, authUserId))

  const sendPromises = subscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        JSON.stringify(payload)
      )
    } catch (error) {
      // If subscription is invalid (410 Gone), remove it
      if (error instanceof webpush.WebPushError && error.statusCode === 410) {
        await db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.id, sub.id))
        console.log(`Removed expired subscription for user ${authUserId}`)
      } else {
        console.error(`Push notification failed for user ${authUserId}:`, error)
      }
    }
  })

  await Promise.all(sendPromises)
}

// Send push notification to all guardians in a family
export async function sendPushToFamily(familyId: string, payload: PushPayload): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('VAPID keys not configured, skipping push notification')
    return
  }

  // Get all guardians in this family
  const guardians = await db
    .select({ authUserId: guardianFamilies.authUserId })
    .from(guardianFamilies)
    .where(eq(guardianFamilies.familyId, familyId))

  // Send to each guardian
  await Promise.all(
    guardians.map((guardian) => sendPushToUser(guardian.authUserId, payload))
  )
}

// Export VAPID public key for client-side subscription
export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY
}
