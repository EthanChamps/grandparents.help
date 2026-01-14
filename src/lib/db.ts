import { neon, NeonQueryFunction } from '@neondatabase/serverless'

let sqlClient: NeonQueryFunction<false, false> | null = null

export function getSQL() {
  if (!sqlClient) {
    sqlClient = neon(process.env.DATABASE_URL!)
  }
  return sqlClient
}

export async function logEvent(
  userId: string | null,
  eventType: string,
  metadata?: Record<string, unknown>
) {
  try {
    const sql = getSQL()
    await sql`
      INSERT INTO public.events (user_id, event_type, metadata)
      VALUES (${userId}, ${eventType}, ${JSON.stringify(metadata ?? {})})
    `
  } catch (error) {
    console.error('Failed to log event:', error)
  }
}

export async function saveMessage(
  userId: string,
  role: 'user' | 'assistant',
  content: string,
  imageUrl?: string
) {
  try {
    const sql = getSQL()
    await sql`
      INSERT INTO public.messages (user_id, role, content, image_url)
      VALUES (${userId}, ${role}, ${content}, ${imageUrl ?? null})
    `
  } catch (error) {
    console.error('Failed to save message:', error)
  }
}
