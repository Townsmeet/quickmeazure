import { applyMigrationsAndSeed } from '../utils/migration-helper'

export default defineNitroPlugin(async () => {
  console.log('🚀 Starting server plugin: Apply database migrations and seed')

  // Skip migrations if SKIP_MIGRATIONS environment variable is set to true
  if (process.env.SKIP_MIGRATIONS === 'true') {
    console.log('⏭️ Skipping migrations and seed as SKIP_MIGRATIONS is set to true')
    return
  }

  // Apply migrations and seed plans
  try {
    await applyMigrationsAndSeed()
  } catch (error) {
    console.error('❌ Failed to apply migrations and seed:', error)
  }
})
