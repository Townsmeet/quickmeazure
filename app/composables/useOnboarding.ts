// Onboarding composable for easy access to onboarding utilities
import {
  onboardingSteps,
  getCurrentOnboardingStep,
  getRequiredOnboardingPath,
  canAccessPath,
  getOnboardingProgress,
  getNextOnboardingStep,
  isOnboardingPath,
  getOnboardingStatusMessage,
  hasActiveSubscription,
} from '~/utils/onboarding'

export const useOnboarding = () => {
  const { user } = useAuth()

  // Reactive computed properties
  const currentStep = computed(() => getCurrentOnboardingStep(user.value))
  const requiredPath = computed(() => getRequiredOnboardingPath(user.value))
  const progress = computed(() => getOnboardingProgress(user.value))
  const statusMessage = computed(() => getOnboardingStatusMessage(user.value))
  const nextStep = computed(() => getNextOnboardingStep(user.value))
  const isComplete = computed(() => currentStep.value === 'complete')
  const hasSubscription = computed(() => hasActiveSubscription(user.value))

  // Helper functions
  const canAccess = (path: string) => canAccessPath(user.value, path)
  const isOnboardingRoute = (path: string) => isOnboardingPath(path)

  // Navigation helpers
  const goToNextStep = () => {
    const nextPath = requiredPath.value
    if (nextPath) {
      return navigateTo(nextPath)
    }
    return navigateTo('/dashboard')
  }

  const goToStep = (stepKey: string) => {
    const step = onboardingSteps.find(s => s.key === stepKey)
    if (step && canAccess(step.path)) {
      return navigateTo(step.path)
    }
  }

  // Get step by key
  const getStep = (stepKey: string) => {
    return onboardingSteps.find(s => s.key === stepKey)
  }

  // Check if specific step is completed
  const isStepCompleted = (stepKey: string) => {
    const stepIndex = onboardingSteps.findIndex(s => s.key === stepKey)
    const currentIndex = onboardingSteps.findIndex(s => s.key === currentStep.value)
    return stepIndex < currentIndex || currentStep.value === 'complete'
  }

  // Check if specific step is active
  const isStepActive = (stepKey: string) => {
    return currentStep.value === stepKey
  }

  return {
    // Data
    steps: onboardingSteps,
    currentStep,
    requiredPath,
    progress,
    statusMessage,
    nextStep,
    isComplete,
    hasSubscription,

    // Methods
    canAccess,
    isOnboardingRoute,
    goToNextStep,
    goToStep,
    getStep,
    isStepCompleted,
    isStepActive,
  }
}
