import type { H3Event } from 'h3'
import { createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../utils/drizzle'
import * as tables from '../../database/schema'

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

    // Get business info for user with only the fields we need
    const business = await db
      .select({
        businessName: tables.businesses.businessName,
        yearsInBusiness: tables.businesses.yearsInBusiness,
        businessDescription: tables.businesses.businessDescription,
        phone: tables.businesses.phone,
        address: tables.businesses.address,
        city: tables.businesses.city,
        state: tables.businesses.state,
        specializations: tables.businesses.specializations,
        image: tables.businesses.image,
        updatedAt: tables.businesses.updatedAt,
      })
      .from(tables.businesses)
      .where(eq(tables.businesses.userId, userId))
      .limit(1)

    return {
      success: true,
      data: business.length > 0 ? business[0] : null,
    }
  } catch (error: any) {
    console.error('Error fetching business info:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch business information',
      message: 'Failed to fetch business information',
    }
  }
})
