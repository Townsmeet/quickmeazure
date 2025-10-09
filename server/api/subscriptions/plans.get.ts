import { defineEventHandler, createError } from 'h3'
import { db } from '../../utils/drizzle'
import * as tables from '../../database/schema'
import { ok } from '../../validators'

/**
 * Get available subscription plans from the database
 */
export default defineEventHandler(async event => {
  try {
    // Get authenticated user from event context (set by auth middleware)
    const auth = event.context.auth
    if (!auth || !auth.userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      })
    }

    // Query active plans from the database
    const dbPlans = await db
      .select()
      .from(tables.plans)
      .where(eq(tables.plans.isActive, true))
      .execute()

    console.log(`Found ${dbPlans.length} active plans in database`)

    // Transform database plans to match the expected format
    const plans = dbPlans.map(plan => {
      // Parse features from JSON if it exists
      let features = []
      try {
        if (plan.features) {
          features = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features
        }
      } catch (e) {
        console.error('Error parsing plan features:', e)
        features = []
      }

      // Create a standardized plan object
      return {
        id: String(plan.id),
        name: plan.name,
        description: plan.description,
        price: Number(plan.price),
        interval: plan.interval === 'annual' ? 'year' : plan.interval, // Normalize interval naming
        features: features,
        limits: {
          clients: plan.maxClients || 0,
          templates: plan.maxStyles || 0,
          users: 1, // Default to 1 user
          storage: plan.maxStorage || 0,
        },
        isFeatured: plan.isFeatured || false,
      }
    })

    // Sort plans by price
    plans.sort((a, b) => a.price - b.price)

    console.log(
      'Returning plans:',
      plans.map(p => `${p.name} (${p.id}): ${p.price}`)
    )
    return { success: true, data: plans }
  } catch (error) {
    console.error('Error fetching subscription plans:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch subscription plans',
      message: 'Failed to fetch subscription plans',
    }
  }
})
