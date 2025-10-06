import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../utils/drizzle'
import { ok } from '../../validators'
import { z } from 'zod'

/**
 * Verify Paystack payment
 */
export default defineEventHandler(async event => {
  try {
    // Auth via middleware
    const auth = event.context.auth
    if (!auth || !auth.userId) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    // Validate body and support legacy field names
    const BodySchema = z.object({
      reference: z.string().min(1),
      plan_id: z.union([z.number().int(), z.string()]).optional(),
      planId: z.union([z.number().int(), z.string()]).optional(),
      billing_period: z.enum(['month', 'monthly', 'year', 'annual']).optional(),
      billingPeriod: z.enum(['monthly', 'annual']).optional(),
    })
    const raw = BodySchema.parse(await readBody(event))
    const reference = raw.reference
    const planIdRaw = raw.planId ?? raw.plan_id
    const billingPeriodRaw = raw.billingPeriod ?? raw.billing_period

    if (!reference) {
      return { success: false, message: 'Payment reference is required' }
    }

    // Get Paystack secret key from server environment
    const paystackSecretKey =
      process.env.NUXT_PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY

    if (!paystackSecretKey) {
      console.error('Paystack secret key not found in environment variables')
      return {
        success: false,
        message: 'Server configuration error',
      }
    }

    // Verify payment with Paystack API
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Paystack API error:', data)
      return {
        success: false,
        message: 'Payment verification failed',
      }
    }

    if (data.status && data.data.status === 'success') {
      // Payment was successful
      try {
        const userId = String(auth.userId)
        console.log('Verified user ID from context:', userId)

        // Ensure plan_id is a number
        const planIdNum =
          typeof planIdRaw === 'string' && !isNaN(Number(planIdRaw))
            ? Number(planIdRaw)
            : (planIdRaw as number | undefined)
        if (!planIdNum) {
          console.warn('No planId provided in verify payload; skipping subscription update')
        }

        // Find the plan
        const plan = planIdNum
          ? await db.query.plans.findFirst({ where: eq(tables.plans.id, planIdNum) })
          : null

        if (planIdNum && !plan) {
          console.error('Plan not found:', planIdNum)
          return { success: false, message: 'Selected plan not found' }
        }

        console.log('Found plan:', plan.name, 'with ID:', plan.id)

        // Calculate subscription end date based on billing period
        const startDate = new Date()
        const endDate = new Date(startDate)

        const normalizedBilling =
          billingPeriodRaw === 'month' || billingPeriodRaw === 'monthly' ? 'monthly' : 'annual'
        if (normalizedBilling === 'monthly') {
          endDate.setMonth(endDate.getMonth() + 1)
        } else {
          endDate.setFullYear(endDate.getFullYear() + 1)
        }

        // Check if user already has an active subscription
        const existingSubscription = await db.query.subscriptions.findFirst({
          where: and(
            eq(tables.subscriptions.userId, String(userId)),
            eq(tables.subscriptions.status, 'active')
          ),
        })

        let subscriptionResult

        if (existingSubscription && plan) {
          // Update existing subscription
          subscriptionResult = await db
            .update(tables.subscriptions)
            .set({
              planId: plan.id,
              billingPeriod: normalizedBilling,
              startDate,
              endDate,
              nextBillingDate: endDate,
              amount: data.data.amount / 100, // Convert from kobo to naira
              paymentReference: reference,
              updatedAt: new Date(),
            })
            .where(eq(tables.subscriptions.id, existingSubscription.id))
            .returning()

          console.log('Updated existing subscription:', subscriptionResult[0]?.id)
        } else if (plan) {
          // Create new subscription
          subscriptionResult = await db
            .insert(tables.subscriptions)
            .values({
              userId: String(userId),
              planId: plan.id,
              status: 'active',
              startDate,
              endDate,
              billingPeriod: normalizedBilling,
              amount: data.data.amount / 100, // Convert from kobo to naira
              paymentReference: reference,
              paymentMethod: 'paystack',
              nextBillingDate: endDate,
            })
            .returning()

          console.log('Created new subscription:', subscriptionResult[0]?.id)
        }

        // Generate a new token with updated subscription information
        const newToken = plan
          ? generateToken({
              id: userId,
              subscriptionPlan: plan.id.toString(),
              subscriptionExpiry: Math.floor(endDate.getTime() / 1000),
            })
          : null

        console.log('Generated new token with subscription data')

        // Return success with the new token
        return ok({
          amount: data.data.amount / 100,
          reference: data.data.reference,
          plan_id: plan?.id,
          subscription: subscriptionResult?.[0] || null,
          token: newToken || undefined,
        })
      } catch (subscriptionError) {
        console.error('Error creating subscription:', subscriptionError)
        throw createError({
          statusCode: 500,
          statusMessage: 'Payment verified, but subscription creation failed',
        })
      }

      return ok({
        amount: data.data.amount / 100,
        reference: data.data.reference,
        plan_id: planIdRaw,
      })
    } else {
      return ok({ reference: data.data.reference, status: 'not_successful' })
    }
  } catch (error) {
    console.error('Error verifying payment:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'An error occurred while verifying payment',
    })
  }
})
