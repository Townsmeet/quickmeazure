import * as path from 'path'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { db } from './drizzle'
import { seedPlans } from './seed-plans'

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

export async function applyMigrationsAndSeed() {
  try {
    // First apply migrations
    const migrationSuccess = await applyMigrations()

    if (!migrationSuccess) {
      console.error('⚠️ Skipping seed due to migration failure')
      return false
    }

    // Then seed plans
    console.log('🌱 Seeding plans after migration...')
    await seedPlans()

    return true
  } catch (error) {
    console.error('❌ Migration and seed process failed:', error)
    return false
  }
}
