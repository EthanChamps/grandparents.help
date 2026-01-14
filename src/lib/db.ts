// Re-export everything from new db module
// This file kept for backwards compatibility
export { db } from './db/index'
export * from './db/schema'

import { db, events, messages } from './db/index'

/**
 * Log an analytics event
 * @deprecated Use db.insert(events).values() directly
 */
export async function logEvent(
  userId: string | null,
  eventType: string,
  metadata?: Record<string, unknown>
) {
  try {
    await db.insert(events).values({
      userId: userId ?? undefined,
      eventType,
      metadata: metadata ?? {},
    })
  } catch (error) {
    console.error('Failed to log event:', error)
  }
}

/**
 * Save a chat message
 * @deprecated Use db.insert(messages).values() directly
 */
export async function saveMessage(
  userId: string,
  role: 'user' | 'assistant',
  content: string,
  imageUrl?: string
) {
  try {
    await db.insert(messages).values({
      userId,
      role,
      content,
      imageUrl: imageUrl ?? undefined,
    })
  } catch (error) {
    console.error('Failed to save message:', error)
  }
}
