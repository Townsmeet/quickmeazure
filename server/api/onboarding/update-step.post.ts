import { eq } from 'drizzle-orm'
import { db } from '../../utils/drizzle'
import { user } from '../../database/schema'
import { auth } from '../../utils/auth'

export default defineEventHandler(async event => {
  try {
    // Get the authenticated user
    const session = await auth.api.getSession({ headers: event.headers })

    if (!session?.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      })
    }

    const body = await readBody(event)
    const { step, subscriptionStatus, hasActiveSubscription, hasCompletedSetup } = body

    // Validate step
    const validSteps = ['verification', 'subscription', 'setup', 'complete']
    if (step && !validSteps.includes(step)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid onboarding step',
      })
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (step) {
      updateData.onboardingStep = step

      // Auto-set completion timestamp when reaching complete step
      if (step === 'complete') {
        updateData.onboardingCompletedAt = new Date()
        updateData.hasCompletedSetup = true
      }
    }

    if (subscriptionStatus !== undefined) {
      updateData.subscriptionStatus = subscriptionStatus

      // Auto-update hasActiveSubscription based on status
      updateData.hasActiveSubscription = subscriptionStatus === 'active'
    }

    if (hasActiveSubscription !== undefined) {
      updateData.hasActiveSubscription = hasActiveSubscription
    }

    if (hasCompletedSetup !== undefined) {
      updateData.hasCompletedSetup = hasCompletedSetup
    }

    // Update user in database
    await db.update(user).set(updateData).where(eq(user.id, session.user.id))

    return {
      success: true,
      message: 'Onboarding step updated successfully',
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to update onboarding step',
    })
  }
})
