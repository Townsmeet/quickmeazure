import { defineEventHandler, createError, getRouterParam } from 'h3'
import { db } from '../../../utils/drizzle'
import * as tables from '../../../database/schema'
import { eq, and, ne } from 'drizzle-orm'

/**
 * Delete a payment method for the current user
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

    const paymentMethodId = getRouterParam(event, 'id')

    if (!paymentMethodId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Payment method ID is required',
      })
    }

    const userId = auth.userId

    // Check if this is the user's default payment method
    const paymentMethod = await db
      .select()
      .from(tables.paymentMethods)
      .where(
        and(
          eq(tables.paymentMethods.id, parseInt(paymentMethodId)),
          eq(tables.paymentMethods.userId, String(userId))
        )
      )
      .limit(1)

    if (!paymentMethod || paymentMethod.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Payment method not found',
      })
    }

    // Check if user has an active subscription and this is their only payment method
    if (paymentMethod[0].isDefault) {
      const otherPaymentMethods = await db
        .select()
        .from(tables.paymentMethods)
        .where(
          and(
            eq(tables.paymentMethods.userId, String(userId)),
            ne(tables.paymentMethods.id, parseInt(paymentMethodId))
          )
        )

      const activeSubscription = await db
        .select()
        .from(tables.subscriptions)
        .where(
          and(
            eq(tables.subscriptions.userId, String(userId)),
            eq(tables.subscriptions.status, 'active')
          )
        )
        .limit(1)

      if (activeSubscription.length > 0 && otherPaymentMethods.length === 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Cannot delete the only payment method with an active subscription',
        })
      }

      // If there are other payment methods, set one as default
      if (otherPaymentMethods.length > 0) {
        await db
          .update(tables.paymentMethods)
          .set({
            isDefault: true,
            updatedAt: new Date(),
          })
          .where(eq(tables.paymentMethods.id, otherPaymentMethods[0].id))
      }
    }

    // Delete the payment method
    const result = await db
      .delete(tables.paymentMethods)
      .where(
        and(
          eq(tables.paymentMethods.id, parseInt(paymentMethodId)),
          eq(tables.paymentMethods.userId, String(userId))
        )
      )

    if (result.changes === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Payment method not found',
      })
    }

    return {
      success: true,
      message: 'Payment method deleted successfully',
    }
  } catch (error) {
    console.error('Error deleting payment method:', error)

    if (error.statusCode) {
      throw error
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete payment method',
      message: 'Failed to delete payment method',
    }
  }
})
