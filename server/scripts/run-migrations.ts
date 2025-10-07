import * as dotenv from 'dotenv'
import { applyMigrationsAndSeed } from '../utils/migration-helper'

// Load environment variables
dotenv.config()

async function runMigrations() {
  try {
    console.log('🔄 Starting database migration and seed process...')

    const success = await applyMigrationsAndSeed()

    if (success) {
      console.log('✅ Migrations and seed completed successfully')
      process.exit(0)
    } else {
      console.error('❌ Migrations and seed failed')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Unexpected error running migrations and seed:', error)
    process.exit(1)
  }
}

// Run the migrations and seed
runMigrations().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
