import { eq, and, desc, isNull, or, gt } from 'drizzle-orm'
import { db } from '../../utils/drizzle'
import * as tables from '../../database/schema'

export default defineEventHandler(async event => {
  try {
    const auth = event.context.auth
    if (!auth || !auth.userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      })
    }

    // Get user data from Better Auth user table
    const userData = await db
      .select({
        id: tables.user.id,
        email: tables.user.email,
        name: tables.user.name,
        avatar: tables.user.image,
        emailVerified: tables.user.emailVerified,
        createdAt: tables.user.createdAt,
        updatedAt: tables.user.updatedAt,
      })
      .from(tables.user)
      .where(eq(tables.user.id, auth.userId))
      .limit(1)
      .then(results => results[0])

    if (!userData) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      })
    }

    // Get user profile data from businesses table
    const profileData = await db
      .select()
      .from(tables.businesses)
      .where(eq(tables.businesses.userId, auth.userId))
      .limit(1)
      .then(results => results[0] || null)

    // Get the user's active subscription
    const activeSubscription = await db
      .select({
        id: tables.subscriptions.id,
        status: tables.subscriptions.status,
        startDate: tables.subscriptions.startDate,
        endDate: tables.subscriptions.endDate,
        planName: tables.plans.name,
      })
      .from(tables.subscriptions)
      .leftJoin(tables.plans, eq(tables.subscriptions.planId, tables.plans.id))
      .where(
        and(
          eq(tables.subscriptions.userId, auth.userId),
          eq(tables.subscriptions.status, 'active'),
          or(isNull(tables.subscriptions.endDate), gt(tables.subscriptions.endDate, new Date()))
        )
      )
      .orderBy(desc(tables.subscriptions.startDate))
      .limit(1)
      .then(results => results[0] || null)

    // Combine user data with profile and subscription info
    return {
      success: true,
      data: {
        ...userData,
        ...profileData,
        subscription: activeSubscription
          ? {
              plan: activeSubscription.planName,
              status: activeSubscription.status,
              expiryDate: activeSubscription.endDate,
            }
          : {
              plan: 'free',
              status: 'inactive',
              expiryDate: null,
            },
      },
    }
  } catch (error) {
    console.error('Error fetching profile:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      message: 'Internal server error',
    }
  }
})
