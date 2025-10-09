import { eq, desc } from 'drizzle-orm'
import { db } from '../../utils/drizzle'
import * as tables from '../../database/schema'

export default defineEventHandler(async _event => {
  try {
    // Fetch all active plans from the database
    const availablePlans = await db
      .select()
      .from(tables.plans)
      .where(eq(tables.plans.isActive, true))
      .orderBy(desc(tables.plans.price)) // Order by price in descending order (highest first)

    // Transform the data to match the format expected by the frontend
    const formattedPlans = availablePlans.map(plan => {
      return {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        interval: plan.interval,
        features: plan.features || [],
        isFeatured: plan.isFeatured,
        maxClients: plan.maxClients,
        maxStyles: plan.maxStyles,
        maxStorage: plan.maxStorage,
      }
    })

    return { success: true, data: { plans: formattedPlans } }
  } catch (error) {
    console.error('Error fetching plans:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch plans',
      message: 'Failed to fetch plans',
    }
  }
})
