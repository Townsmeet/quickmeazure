import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '../database/schema'

// Using process.env directly for CLI compatibility
export const db = drizzle({
  connection: {
    url: process.env.NUXT_TURSO_DATABASE_URL!,
    authToken: process.env.NUXT_TURSO_AUTH_TOKEN!,
  },
  schema,
})
