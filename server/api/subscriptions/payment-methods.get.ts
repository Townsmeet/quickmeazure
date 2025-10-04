import { defineEventHandler, createError } from 'h3'
import { useDrizzle, tables, eq } from '../../utils/drizzle'
import { ok } from '../../validators'

/**
 * Get the current user's payment methods
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
    const userId = auth.userId

    // Get database instance
    const db = useDrizzle()

    // Find the user's payment methods
    console.log('Querying for payment methods for user ID:', userId)

    const paymentMethods = await db
      .select()
      .from(tables.paymentMethods)
      .where(eq(tables.paymentMethods.userId, String(userId)))
      .execute()

    return ok(
      paymentMethods.map(method => ({
        id: method.id,
        type: method.type,
        last4: method.last4,
        expiryMonth: method.expiryMonth,
        expiryYear: method.expiryYear,
        isDefault: method.isDefault,
        brand: method.brand,
        createdAt: method.createdAt,
        updatedAt: method.updatedAt,
      }))
    )
  } catch (err) {
    console.error('Error retrieving payment methods:', err)
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || 'Internal server error',
    })
  }
})
