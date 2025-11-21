import { defineEventHandler, readBody, createError } from 'h3'
import { eq, and } from 'drizzle-orm'
import { db } from '../../utils/drizzle'
import * as tables from '../../database/schema'
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
      return {
        success: false,
        error: 'Payment reference is required',
        message: 'Payment reference is required',
      }
    }

    // Get Paystack secret key from server environment
    const paystackSecretKey =
      process.env.NUXT_PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY

    if (!paystackSecretKey) {
      console.error('Paystack secret key not found in environment variables')
      return {
        success: false,
        error: 'Server configuration error',
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

        // planIdRaw can be either a slug (string) or numeric ID
        const planSlug = typeof planIdRaw === 'string' ? planIdRaw : String(planIdRaw)

        // Normalize billing interval for DB ('monthly'|'month' => 'month', 'annually'|'annual'|'year' => 'annual')
        let normalizedInterval: string
        if (
          billingPeriodRaw === 'annual' ||
          billingPeriodRaw === 'annually' ||
          billingPeriodRaw === 'year'
        ) {
          normalizedInterval = 'annual'
        } else if (billingPeriodRaw === 'month' || billingPeriodRaw === 'monthly') {
          normalizedInterval = 'month'
        } else {
          normalizedInterval = String(billingPeriodRaw)
        }
        if (!planSlug) {
          console.warn('No planId provided in verify payload; skipping subscription update')
        }

        // Find the plan by slug AND interval!
        const plan = planSlug
          ? await db.query.plans.findFirst({
              where: and(
                eq(tables.plans.slug, planSlug),
                eq(tables.plans.interval, normalizedInterval)
              ),
            })
          : null

        if (planSlug && !plan) {
          console.error('Plan not found:', planSlug, 'interval:', normalizedInterval)
          return {
            success: false,
            error: 'Selected plan not found',
            message: 'Selected plan not found',
          }
        }

        // Calculate subscription end date based on billing period
        const startDate = new Date()
        const endDate = new Date(startDate)

        if (normalizedInterval === 'month') {
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
              billingPeriod: normalizedInterval,
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
              billingPeriod: normalizedInterval,
              amount: data.data.amount / 100, // Convert from kobo to naira
              paymentReference: reference,
              paymentMethod: 'paystack',
              nextBillingDate: endDate,
            })
            .returning()

          console.log('Created new subscription:', subscriptionResult[0]?.id)
        }

        // Create a payment record for the subscription (billing history)
        if (plan && subscriptionResult && subscriptionResult[0]) {
          console.log('Creating subscription payment record for initial subscription')
          try {
            const paymentRecord = await db
              .insert(tables.subscriptionPayments)
              .values({
                userId: String(userId),
                subscriptionId: subscriptionResult[0].id,
                amount: data.data.amount / 100, // Convert from kobo to naira
                currency: 'NGN',
                status: 'successful',
                reference: reference,
                description: `Subscription to ${plan.name} (${normalizedInterval})`,
                provider: 'paystack',
                metadata: JSON.stringify({
                  planId: plan.id,
                  planSlug: plan.slug,
                  billingInterval: normalizedInterval,
                  paystackReference: data.data.reference,
                  transactionDate: new Date().toISOString(),
                }),
              })
              .returning()

            console.log('Created subscription payment record:', paymentRecord[0]?.id)
          } catch (paymentError) {
            // Log the error but don't fail the whole operation
            console.error('Failed to create subscription payment record:', paymentError)
          }
        }

        // Ensure business profile exists (same as create.post.ts)
        const existingBusiness = await db.query.businesses.findFirst({
          where: eq(tables.businesses.userId, String(userId)),
        })

        if (!existingBusiness) {
          await db.insert(tables.businesses).values({
            userId: String(userId),
            hasCompletedSetup: false,
            createdAt: new Date(),
          })
          console.log('Created business profile for user:', userId)
        }

        // Update user subscription status and onboarding step
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

        // --- SAVE PAYMENT METHOD (extract authorization) ---
        const authz = data.data.authorization
        if (authz?.authorization_code) {
          // Save (or update) payment method
          const existingMethod = await db.query.paymentMethods.findFirst({
            where: eq(tables.paymentMethods.userId, userId),
          })
          const cardObj = {
            type: 'card',
            last4: authz.last4 || null,
            expiryMonth: authz.exp_month || null,
            expiryYear: authz.exp_year || null,
            brand: authz.brand || authz.bank || null,
            isDefault: true,
            provider: 'paystack',
            providerId: authz.authorization_code,
            metadata: JSON.stringify({
              authorizationCode: authz.authorization_code,
              cardType: authz.card_type,
              bank: authz.bank,
              countryCode: authz.country_code,
              signature: authz.signature,
              reusable: authz.reusable,
              channel: authz.channel,
            }),
            updatedAt: new Date(),
          }
          if (existingMethod) {
            // Update
            await db
              .update(tables.paymentMethods)
              .set(cardObj)
              .where(eq(tables.paymentMethods.id, existingMethod.id))
          } else {
            // Insert new default
            await db.insert(tables.paymentMethods).values({
              ...cardObj,
              userId,
              createdAt: new Date(),
            })
          }
        }

        // Return success with subscription data + billing period
        return {
          success: true,
          data: {
            amount: data.data.amount / 100,
            reference: data.data.reference,
            plan_id: plan?.id,
            subscription: subscriptionResult?.[0] || null,
            billingPeriod: normalizedInterval,
            planSlug: plan?.slug,
          },
        }
      } catch (subscriptionError) {
        console.error('Error creating subscription:', subscriptionError)
        throw createError({
          statusCode: 500,
          statusMessage: 'Payment verified, but subscription creation failed',
        })
      }

      return {
        success: true,
        data: {
          amount: data.data.amount / 100,
          reference: data.data.reference,
          plan_id: planIdRaw,
        },
      }
    } else {
      return { success: true, data: { reference: data.data.reference, status: 'not_successful' } }
    }
  } catch (error) {
    console.error('Error verifying payment:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred while verifying payment',
      message: 'An error occurred while verifying payment',
    }
  }
})
