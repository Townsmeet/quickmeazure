import { defineEventHandler, readBody, createError, getRequestHeaders } from 'h3'
import { useDrizzle, tables, eq, and } from '~/server/utils/drizzle'
import { verifyToken, generateToken } from '~/server/utils/auth'
// Subscription type import removed as it's not being used

/**
 * Create a new subscription after successful payment
 * Also handles free/growth plan subscriptions
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

    if (!userId) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized - Invalid user ID',
      })
    }

    // Read request body
    const {
      planId,
      planName = '',
      paymentReference,
      billingPeriod,
      amount,
      cardDetails, // Added to capture card details from payment provider
    } = await readBody(event)

    // Validate required fields - planId and billingPeriod are always required
    if (!planId || !billingPeriod) {
      throw createError({
        statusCode: 400,
        message: 'Missing required fields: planId and billingPeriod are required',
      })
    }

    // Check if this is a free/growth plan (no payment required)
    const isFreeOrGrowthPlan =
      planName?.toLowerCase() === 'growth' || planName?.toLowerCase() === 'free'

    // For paid plans, validate payment information
    if (!isFreeOrGrowthPlan && (!paymentReference || !amount)) {
      throw createError({
        statusCode: 400,
        message: 'Payment reference and amount are required for paid plans',
      })
    }

    // Get database instance
    const db = useDrizzle()

    // Find the plan - ensure planId is converted to a number if it's a string
    const planIdNum = typeof planId === 'string' && !isNaN(Number(planId)) ? Number(planId) : planId
    console.log('Looking for plan with ID:', planIdNum, 'Original value:', planId)

    const plan = await db.query.plans.findFirst({
      where: eq(tables.plans.id, planIdNum),
    })

    if (!plan) {
      throw createError({
        statusCode: 404,
        message: 'Plan not found',
      })
    }

    // Calculate subscription end date based on billing period
    const startDate = new Date()
    const endDate = new Date(startDate)

    if (billingPeriod === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1)
    } else if (billingPeriod === 'annual') {
      endDate.setFullYear(endDate.getFullYear() + 1)
    } else {
      throw createError({
        statusCode: 400,
        message: 'Invalid billing period',
      })
    }

    // Check if user already has an active subscription
    const existingSubscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(tables.subscriptions.userId, Number(userId)),
        eq(tables.subscriptions.status, 'active')
      ),
    })

    const subscriptionData = {
      planId,
      billingPeriod,
      startDate,
      endDate,
      nextBillingDate: endDate,
      // For free/growth plans, we don't require payment info
      amount: isFreeOrGrowthPlan ? 0 : amount,
      paymentReference: isFreeOrGrowthPlan ? 'free-plan' : paymentReference,
      updatedAt: new Date(),
    }

    if (existingSubscription) {
      // Update existing subscription
      const updatedSubscription = await db
        .update(tables.subscriptions)
        .set(subscriptionData)
        .where(eq(tables.subscriptions.id, existingSubscription.id))
        .returning()

      // Get the plan details for the token
      const planDetails = await db.query.plans.findFirst({
        where: eq(tables.plans.id, planId),
      })

      // Generate a new token with subscription information
      const newToken = generateToken({
        id: userId,
        subscriptionPlan: planDetails?.name || '',
        subscriptionExpiry: Math.floor(endDate.getTime() / 1000),
      })

      return {
        success: true,
        message: 'Subscription updated successfully',
        data: updatedSubscription[0],
        token: newToken,
      }
    } else {
      // Create new subscription
      const newSubscription = await db
        .insert(tables.subscriptions)
        .values({
          userId: typeof userId === 'string' ? Number(userId) : userId,
          planId: planIdNum,
          status: 'active',
          startDate: new Date(),
          billingPeriod,
          amount: amount || 0,
          paymentReference: paymentReference || null,
          paymentMethod: paymentReference ? 'paystack' : 'free',
          nextBillingDate:
            billingPeriod === 'monthly'
              ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
              : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        })
        .returning()

      // Update user's hasCompletedSetup to false to ensure they complete the setup
      await db
        .update(tables.users)
        .set({
          hasCompletedSetup: false,
          updatedAt: new Date(),
        })
        .where(eq(tables.users.id, userId))

      // Get the plan details for the token
      const planDetails = await db.query.plans.findFirst({
        where: eq(tables.plans.id, planId),
      })

      // Generate a new token with subscription information
      const newToken = generateToken({
        id: userId,
        subscriptionPlan: planDetails?.name || '',
        subscriptionExpiry: Math.floor(
          (billingPeriod === 'monthly'
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          ).getTime() / 1000
        ),
      })

      // For paid plans, save or update the payment method
      // Using the single payment method approach - each user has only one payment method
      if (!isFreeOrGrowthPlan && paymentReference && cardDetails) {
        try {
          console.log('Processing payment method for subscription')

          // Check if the user already has a payment method
          const existingPaymentMethod = await db.query.paymentMethods.findFirst({
            where: eq(tables.paymentMethods.userId, Number(userId)),
          })

          if (existingPaymentMethod) {
            // Update the existing payment method
            console.log('Updating existing payment method for user ID:', userId)

            await db
              .update(tables.paymentMethods)
              .set({
                type: cardDetails.type || 'card',
                last4: cardDetails.last4,
                expiryMonth: cardDetails.expiryMonth,
                expiryYear: cardDetails.expiryYear,
                brand: cardDetails.brand,
                provider: 'paystack',
                providerId: cardDetails.providerId || paymentReference,
                metadata:
                  typeof cardDetails.metadata === 'string'
                    ? cardDetails.metadata
                    : JSON.stringify(cardDetails.metadata || {}),
                updatedAt: new Date(),
              })
              .where(eq(tables.paymentMethods.id, existingPaymentMethod.id))
          } else {
            // Create a new payment method
            console.log('Creating new payment method for user ID:', userId)

            await db.insert(tables.paymentMethods).values({
              userId: Number(userId),
              type: cardDetails.type || 'card',
              last4: cardDetails.last4,
              expiryMonth: cardDetails.expiryMonth,
              expiryYear: cardDetails.expiryYear,
              brand: cardDetails.brand,
              isDefault: true, // Always true since it's the only one
              provider: 'paystack',
              providerId: cardDetails.providerId || paymentReference,
              metadata:
                typeof cardDetails.metadata === 'string'
                  ? cardDetails.metadata
                  : JSON.stringify(cardDetails.metadata || {}),
            })
          }
        } catch (paymentMethodError) {
          // Log the error but don't fail the subscription creation
          console.error('Error processing payment method:', paymentMethodError)
        }
      }

      return {
        success: true,
        message: 'Subscription created successfully',
        data: newSubscription[0],
        token: newToken,
      }
    }
  } catch (error: any) {
    console.error('Error creating subscription:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: 'An error occurred while creating subscription',
    })
  }
})
