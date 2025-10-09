import { db } from '../../utils/drizzle'
import * as tables from '../../database/schema'
import { ok } from '../../validators'

/**
 * Cancel the current user's subscription
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

    // Read request body (optional cancellation reason)
    const { reason } = await readBody(event)

    // Find the active subscription for the user
    const subscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(tables.subscriptions.userId, String(userId)),
        eq(tables.subscriptions.status, 'active')
      ),
    })

    if (!subscription) {
      throw createError({
        statusCode: 404,
        message: 'No active subscription found',
      })
    }

    // Update the subscription status to canceled
    const canceledSubscription = await db
      .update(tables.subscriptions)
      .set({
        status: 'canceled',
        canceledAt: new Date(),
        metadata: JSON.stringify({
          ...((subscription.metadata as unknown as Record<string, any>) || {}),
          cancellationReason: reason || 'User requested cancellation',
        }),
        updatedAt: new Date(),
      })
      .where(eq(tables.subscriptions.id, subscription.id))
      .returning()

    return { success: true, data: canceledSubscription[0] }
  } catch (error: any) {
    console.error('Error canceling subscription:', error)

    if (error.statusCode) {
      throw error
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An error occurred while canceling subscription',
      message: 'An error occurred while canceling subscription',
    }
  }
})
