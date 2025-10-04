import type { H3Event } from 'h3'
import { createError } from 'h3'
import { useDrizzle, tables, eq } from '../../utils/drizzle'

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Get authenticated user from event context
    const auth = event.context.auth
    if (!auth || !auth.userId) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized',
      })
    }

    const userId = auth.userId

    // Get database connection
    const db = useDrizzle()

    // Get business info for user
    const business = await db
      .select()
      .from(tables.businesses)
      .where(eq(tables.businesses.userId, userId))
      .limit(1)

    return {
      success: true,
      business: business.length > 0 ? business[0] : null,
    }
  } catch (error: any) {
    console.error('Error fetching business info:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch business information',
    })
  }
})
