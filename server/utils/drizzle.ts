import { drizzle } from 'drizzle-orm/libsql'

import {
  eq,
  and,
  or,
  sql,
  lte,
  inArray,
  desc,
  asc,
  gt,
  gte,
  lt,
  ne,
  isNull,
  isNotNull,
  like,
  notLike,
  between,
} from 'drizzle-orm'

import * as schema from '../database/schema'

// Export tables and query helpers
export const tables = schema
export {
  eq,
  and,
  or,
  sql,
  lte,
  inArray,
  desc,
  asc,
  gt,
  gte,
  lt,
  ne,
  isNull,
  isNotNull,
  like,
  notLike,
  between,
}

// Cache the database connection
let _db: ReturnType<typeof createDrizzleClient> | null = null

function createDrizzleClient() {
  const url = process.env.NUXT_TURSO_DATABASE_URL
  const authToken = process.env.NUXT_TURSO_AUTH_TOKEN

  if (!url) {
    console.error('NUXT_TURSO_DATABASE_URL is not provided in environment variables')
    throw new Error('NUXT_TURSO_DATABASE_URL is required')
  }

  // Create and return the Drizzle client for libsql/Turso
  return drizzle({
    connection: {
      url,
      authToken,
    },
    schema,
  })
}

/**
 * Server composable for Drizzle ORM database access
 */
export function useDrizzle() {
  // Create the client if it doesn't exist yet
  if (!_db) {
    _db = createDrizzleClient()
  }

  return _db
}

// Export types for convenience
export type User = typeof schema.users.$inferSelect
export type Business = typeof schema.businesses.$inferSelect
export type Client = typeof schema.clients.$inferSelect
export type Order = typeof schema.orders.$inferSelect
export type Style = typeof schema.styles.$inferSelect
export type Measurement = typeof schema.measurements.$inferSelect
export type Subscription = typeof schema.subscriptions.$inferSelect
