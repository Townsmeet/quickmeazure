import { defineEventHandler, createError } from 'h3'
import { seedPlans } from '../../utils/seed-plans'

/**
 * Admin endpoint to seed/update plans from code to database
 * In production, you might want to add authentication here
 */
export default defineEventHandler(async event => {
  try {
    // TODO: Add admin authentication check here in production
    // const auth = event.context.auth
    // if (!auth?.isAdmin) throw createError({ statusCode: 403, message: 'Forbidden' })

    await seedPlans()

    return { success: true, data: { message: 'Plans seeded successfully' } }
  } catch (error: any) {
    console.error('Error seeding plans:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to seed plans',
      message: error.message || 'Failed to seed plans',
    }
  }
})
