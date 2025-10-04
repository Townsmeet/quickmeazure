import { defineConfig } from 'drizzle-kit'
export default defineConfig({
  schema: './server/database/schema.ts',
  out: './server/database/migrations',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.NUXT_TURSO_DATABASE_URL as string,
    authToken: process.env.NUXT_TURSO_AUTH_TOKEN as string,
  },
})
