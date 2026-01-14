import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  decimal,
  jsonb,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core'

// ============================================================================
// USERS
// ============================================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: varchar('type', { length: 20 }).notNull(), // 'senior' | 'family'
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('users_email_idx').on(table.email),
  index('users_phone_idx').on(table.phone),
])

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

// ============================================================================
// FAMILIES
// ============================================================================

export const families = pgTable('families', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }).default('trial').notNull(),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export type Family = typeof families.$inferSelect
export type NewFamily = typeof families.$inferInsert

// ============================================================================
// FAMILY MEMBERS (junction table)
// ============================================================================

export const familyMembers = pgTable(
  'family_members',
  {
    familyId: uuid('family_id')
      .notNull()
      .references(() => families.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 20 }).notNull(), // 'guardian' | 'senior'
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.familyId, table.userId] }),
  ]
)

export type FamilyMember = typeof familyMembers.$inferSelect
export type NewFamilyMember = typeof familyMembers.$inferInsert

// ============================================================================
// SESSIONS (for auth)
// ============================================================================

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('sessions_user_id_idx').on(table.userId),
])

export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert

// ============================================================================
// MESSAGES (conversation history)
// ============================================================================

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  role: varchar('role', { length: 20 }).notNull(), // 'user' | 'assistant'
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('messages_user_id_idx').on(table.userId),
  index('messages_created_at_idx').on(table.createdAt),
])

export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert

// ============================================================================
// EVENTS (analytics/logging)
// ============================================================================

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export type Event = typeof events.$inferSelect
export type NewEvent = typeof events.$inferInsert

// ============================================================================
// ALERTS (scam detection for family dashboard)
// ============================================================================

export const alerts = pgTable('alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(), // 'scam_detected' | 'suspicious_activity'
  scamProbability: decimal('scam_probability', { precision: 3, scale: 2 }),
  imageUrl: text('image_url'),
  aiAnalysis: text('ai_analysis'),
  acknowledged: boolean('acknowledged').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('alerts_family_id_idx').on(table.familyId),
  index('alerts_user_id_idx').on(table.userId),
  index('alerts_unacknowledged_idx').on(table.familyId, table.acknowledged),
])

export type Alert = typeof alerts.$inferSelect
export type NewAlert = typeof alerts.$inferInsert
