import { defineEventHandler, createError, readBody } from 'h3'
import { db } from '../../utils/drizzle'
import * as tables from '../../database/schema'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { generateToken } from '../../utils/jwt'

/**
 * Change the current user's subscription plan
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

    // Read request body (plan change details)
    const BodySchema = z.object({
      planId: z.union([z.number().int(), z.string()]),
      billingInterval: z.enum(['month', 'year', 'monthly', 'annual']).default('monthly'),
      paymentReference: z.string().optional(),
      cardDetails: z
        .object({
          type: z.string().optional(),
          last4: z.string().optional(),
          expiryMonth: z.string().optional(),
          expiryYear: z.string().optional(),
          brand: z.string().optional(),
          providerId: z.string().optional(),
          metadata: z.union([z.string(), z.record(z.any())]).optional(),
        })
        .optional(),
    })
    const { planId, billingInterval, paymentReference, cardDetails } = BodySchema.parse(
      await readBody(event)
    )

    // Normalize the billing interval for internal use
    const normalizedInterval =
      billingInterval === 'year' || billingInterval === 'annual' ? 'annual' : 'monthly'

    if (!planId) {
      throw createError({
        statusCode: 400,
        message: 'Plan ID is required',
      })
    }

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

    // Find the requested plan
    // Accept both slug and numeric planId
    let plan
    if (typeof planId === 'string' && isNaN(Number(planId))) {
      // planId is a slug, match by slug+interval
      const matchInterval = normalizedInterval === 'annual' ? 'annual' : 'month'
      plan = await db.query.plans.findFirst({
        where: and(eq(tables.plans.slug, planId), eq(tables.plans.interval, matchInterval)),
      })
    } else {
      // Numeric fallback
      const planIdNum =
        typeof planId === 'string' && !isNaN(Number(planId)) ? Number(planId) : planId
      plan = await db.query.plans.findFirst({
        where: eq(tables.plans.id, planIdNum),
      })
    }

    if (!plan) {
      throw createError({
        statusCode: 404,
        message: 'Requested plan not found',
      })
    }

    // Calculate the new price based on the normalized interval
    const price =
      normalizedInterval === 'annual'
        ? plan.price * 12 * 0.85 // 15% discount for annual billing
        : plan.price

    // Update the subscription with the new plan
    const updatedSubscription = await db
      .update(tables.subscriptions)
      .set({
        planId: typeof planId === 'string' ? Number(planId) : planId,
        billingPeriod: normalizedInterval,
        amount: price,
        updatedAt: new Date(),
        metadata: JSON.stringify({
          ...((subscription.metadata as unknown as Record<string, any>) || {}),
          previousPlanId: subscription.planId,
          planChangedAt: new Date().toISOString(),
        }),
      })
      .where(eq(tables.subscriptions.id, subscription.id))
      .returning()

    // Get the plan details for the token
    const planDetails = await db.query.plans.findFirst({
      where: eq(tables.plans.id, planIdNum),
    })

    // Calculate expiry date based on normalized interval
    const now = new Date()
    const expiryDate = new Date(now)
    if (normalizedInterval === 'annual') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1)
    } else {
      expiryDate.setMonth(expiryDate.getMonth() + 1)
    }

    // Generate a new token with updated subscription information
    // Ensure we're using the plan ID (as a number) for the token, not the plan name
    const newToken = generateToken({
      id: userId,
      subscriptionPlan: planDetails?.id?.toString() || '',
      subscriptionExpiry: Math.floor(expiryDate.getTime() / 1000),
    })

    // Create a payment record for the plan change (only for paid plans)
    if (plan.price > 0) {
      console.log('Creating subscription payment record for plan change')
      try {
        // Use the provided payment reference if available, otherwise generate one
        const reference = paymentReference || `plan-change-${Date.now()}`

        const paymentRecord = await db
          .insert(tables.subscriptionPayments)
          .values({
            userId: String(userId),
            subscriptionId: subscription.id,
            amount: price,
            currency: 'NGN',
            status: 'successful',
            reference: reference,
            description: `Subscription changed to ${plan.name} (${normalizedInterval})`,
            provider: 'paystack',
            metadata: JSON.stringify({
              planId: plan.id,
              previousPlanId: subscription.planId,
              billingInterval: normalizedInterval,
              planChangedAt: new Date().toISOString(),
            }),
          })
          .returning()

        console.log('Created subscription payment record:', paymentRecord[0]?.id)

        // Create or update payment method if card details are provided
        if (cardDetails) {
          // Save (or update) card (same as payments/verify)
          const existingMethod = await db.query.paymentMethods.findFirst({
            where: eq(tables.paymentMethods.userId, String(userId)),
          })
          const cardObj = {
            type: cardDetails.type || 'card',
            last4: cardDetails.last4 || null,
            expiryMonth: cardDetails.expiryMonth || null,
            expiryYear: cardDetails.expiryYear || null,
            brand: cardDetails.brand || null,
            isDefault: true,
            provider: 'paystack',
            providerId: cardDetails.providerId || paymentReference,
            metadata:
              typeof cardDetails.metadata === 'string'
                ? cardDetails.metadata
                : JSON.stringify(cardDetails.metadata || {}),
            updatedAt: new Date(),
          }
          if (existingMethod) {
            await db
              .update(tables.paymentMethods)
              .set(cardObj)
              .where(eq(tables.paymentMethods.id, existingMethod.id))
          } else {
            await db.insert(tables.paymentMethods).values({
              ...cardObj,
              userId: String(userId),
              createdAt: new Date(),
            })
          }
        }
      } catch (paymentError) {
        // Log the error but don't fail the whole operation
        console.error('Failed to process payment information:', paymentError)
      }
    }

    return { success: true, data: { subscription: updatedSubscription[0], token: newToken } }
  } catch (error: any) {
    console.error('Error changing subscription plan:', error)

    if (error.statusCode) {
      throw error
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'An error occurred while changing subscription plan',
      message: 'An error occurred while changing subscription plan',
    }
  }
})
