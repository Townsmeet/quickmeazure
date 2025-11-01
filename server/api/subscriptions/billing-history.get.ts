import { defineEventHandler, createError } from 'h3'
import { db } from '../../utils/drizzle'
import * as tables from '../../database/schema'
import { eq, desc } from 'drizzle-orm'
import { ok as _ok } from '../../validators'

/**
 * Get the current user's billing history
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

    // Find the user's subscription payment history
    // Using a simpler query approach to avoid relation errors
    console.log('Querying for subscription payment history for user ID:', userId)

    const payments = await db
      .select()
      .from(tables.subscriptionPayments)
      .where(eq(tables.subscriptionPayments.userId, String(userId)))
      .orderBy(desc(tables.subscriptionPayments.createdAt))
      .limit(10) // Limit to last 10 payments
      .execute()

    return {
      success: true,
      data: payments.map(payment => ({
        id: payment.id,
        date: payment.createdAt,
        description: payment.description || 'Subscription Payment',
        amount: payment.amount,
        status: payment.status,
        reference: payment.reference,
        metadata: payment.metadata,
      })),
    }
  } catch (err) {
    console.error('Error retrieving billing history:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Internal server error',
      message: err.message || 'Internal server error',
    }
  }
})
