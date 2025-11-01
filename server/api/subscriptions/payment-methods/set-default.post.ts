import { defineEventHandler, createError, readBody } from 'h3'
import { db } from '../../../utils/drizzle'
import * as tables from '../../../database/schema'
import { eq, and } from 'drizzle-orm'

/**
 * Set a payment method as default for the current user
 */
export default defineEventHandler(async event => {
  try {
    // Get authenticated user from event context
    const auth = event.context.auth
    if (!auth || !auth.userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      })
    }

    const body = await readBody(event)
    const { paymentMethodId } = body

    if (!paymentMethodId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Payment method ID is required',
      })
    }

    const userId = auth.userId

    // Start a transaction to update payment methods
    await db.transaction(async tx => {
      // First, set all payment methods for this user to not default
      await tx
        .update(tables.paymentMethods)
        .set({ isDefault: false })
        .where(eq(tables.paymentMethods.userId, String(userId)))

      // Then set the specified payment method as default
      const result = await tx
        .update(tables.paymentMethods)
        .set({
          isDefault: true,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(tables.paymentMethods.id, paymentMethodId),
            eq(tables.paymentMethods.userId, String(userId))
          )
        )

      if (result.changes === 0) {
        throw new Error('Payment method not found or does not belong to user')
      }
    })

    return {
      success: true,
      message: 'Default payment method updated successfully',
    }
  } catch (error) {
    console.error('Error setting default payment method:', error)

    if (error.statusCode) {
      throw error
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update default payment method',
      message: 'Failed to update default payment method',
    }
  }
})
