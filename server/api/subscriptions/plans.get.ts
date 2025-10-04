import { defineEventHandler, createError } from 'h3'
import { useDrizzle, tables, eq } from '../../utils/drizzle'
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

    console.log('Authenticated user ID:', auth.userId)

    console.log('Fetching subscription plans from database')

    // Get database instance
    const db = useDrizzle()

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
    return ok(plans)
  } catch (error) {
    console.error('Error fetching subscription plans:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch subscription plans',
    })
  }
})
