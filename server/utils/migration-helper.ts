import * as path from 'path'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { db } from './drizzle'

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'server/database/migrations')

export async function applyMigrations() {
  try {
    console.log('🔄 Applying database migrations (libsql)...')
    // db is already imported
    await migrate(db, { migrationsFolder: MIGRATIONS_DIR })
    console.log('✅ Migrations completed successfully')
    return true
  } catch (error) {
    console.error('❌ Migration process failed:', error)
    return false
  }
}
