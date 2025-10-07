// Composable for updating onboarding progress
export const useOnboardingUpdates = () => {
  const { user } = useAuth()

  // Update onboarding step
  const updateOnboardingStep = async (step: string | undefined, additionalData: any = {}) => {
    try {
      const body: any = { ...additionalData }
      if (step) {
        body.step = step
      }

      const response = await $fetch('/api/onboarding/update-step', {
        method: 'POST',
        body,
      })

      // Refresh user data to reflect changes
      if (user.value) {
        // Update local user state immediately for better UX
        const updates: any = { ...additionalData }
        if (step) {
          updates.onboardingStep = step
        }

        user.value = {
          ...user.value,
          ...updates,
        }
      }

      return { success: true, data: response }
    } catch (error: any) {
      console.error('Failed to update onboarding step:', error)
      return { success: false, error: error.message }
    }
  }

  // Mark email as verified
  const markEmailVerified = async () => {
    return updateOnboardingStep('subscription', {
      emailVerified: true,
    })
  }

  // Mark subscription as active
  const markSubscriptionActive = async (subscriptionData: any = {}) => {
    return updateOnboardingStep('setup', {
      subscriptionStatus: 'active',
      hasActiveSubscription: true,
      ...subscriptionData,
    })
  }

  // Mark setup as completed
  const markSetupCompleted = async () => {
    return updateOnboardingStep('complete', {
      hasCompletedSetup: true,
    })
  }

  // Update subscription status
  const updateSubscriptionStatus = async (status: string) => {
    return updateOnboardingStep(undefined, {
      subscriptionStatus: status,
      hasActiveSubscription: status === 'active',
    })
  }

  return {
    updateOnboardingStep,
    markEmailVerified,
    markSubscriptionActive,
    markSetupCompleted,
    updateSubscriptionStatus,
  }
}
