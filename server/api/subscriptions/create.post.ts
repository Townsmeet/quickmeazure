import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../utils/drizzle'
import * as tables from '../../database/schema'
import { ok } from '../../validators'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { sendEmail } from '../../utils/email'
import { createSubscriptionConfirmationEmail } from '../../email-templates'

/**
 * Create a new subscription after successful payment
 * Also handles free/growth plan subscriptions
 */
export default defineEventHandler(async event => {
  try {
    // Get authenticated user from event context (set by auth middleware)
    const auth = event.context.auth
    const userId = auth?.userId

    // Require authentication for all subscription creation
    if (!auth || !userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - Please log in to create a subscription',
      })
    }

    console.log('Authenticated user ID:', userId)

    // Read and validate request body
    const BodySchema = z.object({
      planId: z.union([z.number().int(), z.string()]),
      planName: z.string().default(''),
      paymentReference: z.string().optional(),
      billingPeriod: z.enum(['monthly', 'annual']),
      amount: z.number().int().nonnegative().optional(),
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
    const {
      planId,
      planName = '',
      paymentReference,
      billingPeriod,
      amount,
      cardDetails,
    } = BodySchema.parse(await readBody(event))

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

    // Find the plan by slug (since frontend sends string IDs like 'free', 'standard', 'premium')
    const planSlug = typeof planId === 'string' ? planId : planId.toString()
    console.log('Looking for plan with slug:', planSlug, 'Original value:', planId)

    const plan = await db.query.plans.findFirst({
      where: eq(tables.plans.slug, planSlug),
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
        eq(tables.subscriptions.userId, String(userId)),
        eq(tables.subscriptions.status, 'active')
      ),
    })

    const subscriptionData = {
      planId: plan.id, // Use the database integer ID
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

      // Get user information for email
      const user = await db.query.user.findFirst({
        where: eq(tables.user.id, String(userId)),
      })

      // Send subscription confirmation email
      if (user?.email) {
        try {
          const { subject, htmlContent } = createSubscriptionConfirmationEmail(
            planName,
            billingPeriod,
            amount || 0,
            user.name || undefined
          )

          await sendEmail({
            to: user.email,
            subject,
            htmlContent,
          })

          console.log('Subscription confirmation email sent to:', user.email)
        } catch (emailError) {
          console.error('Failed to send subscription confirmation email:', emailError)
          // Don't fail the subscription creation if email fails
        }
      }

      return { success: true, data: { subscription: updatedSubscription[0] } }
    } else {
      // Create new subscription
      const newSubscription = await db
        .insert(tables.subscriptions)
        .values({
          userId: String(userId),
          planId: plan.id, // Use the database integer ID
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

      // Update businesses.hasCompletedSetup to false to ensure setup completeness
      const updatedProfile = await db
        .update(tables.businesses)
        .set({ hasCompletedSetup: false, updatedAt: new Date() })
        .where(eq(tables.businesses.userId, String(userId)))
        .returning()
      if (!updatedProfile.length) {
        await db
          .insert(tables.businesses)
          .values({ userId: String(userId), hasCompletedSetup: false, createdAt: new Date() })
      }

      // Update user's subscription status
      await db
        .update(tables.user)
        .set({
          hasActiveSubscription: true,
          subscriptionStatus: 'active',
          onboardingStep: 'complete',
          onboardingCompletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(tables.user.id, String(userId)))

      // For paid plans, save or update the payment method
      // Using the single payment method approach - each user has only one payment method
      if (!isFreeOrGrowthPlan && paymentReference && cardDetails) {
        try {
          console.log('Processing payment method for subscription')

          // Check if the user already has a payment method
          const existingPaymentMethod = await db.query.paymentMethods.findFirst({
            where: eq(tables.paymentMethods.userId, String(userId)),
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
            await db.insert(tables.paymentMethods).values({
              userId: String(userId),
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

      // Get user information for email
      const user = await db.query.user.findFirst({
        where: eq(tables.user.id, String(userId)),
      })

      // Send subscription confirmation email
      if (user?.email) {
        try {
          const { subject, htmlContent } = createSubscriptionConfirmationEmail(
            planName,
            billingPeriod,
            amount || 0,
            user.name || undefined
          )

          await sendEmail({
            to: user.email,
            subject,
            htmlContent,
          })

          console.log('Subscription confirmation email sent to:', user.email)
        } catch (emailError) {
          console.error('Failed to send subscription confirmation email:', emailError)
          // Don't fail the subscription creation if email fails
        }
      }

      return { success: true, data: { subscription: newSubscription[0] } }
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An error occurred while creating subscription',
      message: 'An error occurred while creating subscription',
    }
  }
})
