// Onboarding flow utilities
import type { User } from 'better-auth'

export interface OnboardingStep {
  key: string
  label: string
  path: string
  description: string
}

export const onboardingSteps: OnboardingStep[] = [
  {
    key: 'verification',
    label: 'Verify Email',
    path: '/auth/verify-email',
    description: 'Confirm your email address',
  },
  {
    key: 'subscription',
    label: 'Choose Plan',
    path: '/auth/confirm',
    description: 'Select your subscription plan',
  },
  {
    key: 'setup',
    label: 'Setup Profile',
    path: '/auth/setup-measurements',
    description: 'Complete your business profile',
  },
  {
    key: 'complete',
    label: 'Dashboard',
    path: '/dashboard',
    description: 'Start using QuickMeazure',
  },
]

export type OnboardingStepKey = 'verification' | 'subscription' | 'setup' | 'complete'

/**
 * Determine the current onboarding step for a user
 */
export function getCurrentOnboardingStep(user: any): OnboardingStepKey {
  if (!user) return 'verification'

  // Use the onboardingStep field if available (from database)
  if (
    user.onboardingStep &&
    ['verification', 'subscription', 'setup', 'complete'].includes(user.onboardingStep)
  ) {
    return user.onboardingStep as OnboardingStepKey
  }

  // Fallback to computed logic for backwards compatibility
  // Check email verification
  if (!user.emailVerified) {
    return 'verification'
  }

  // Check subscription status
  if (!hasActiveSubscription(user)) {
    return 'subscription'
  }

  // Check setup completion
  if (!user.hasCompletedSetup) {
    return 'setup'
  }

  return 'complete'
}

/**
 * Get the required onboarding path for a user
 */
export function getRequiredOnboardingPath(user: any): string | null {
  const currentStep = getCurrentOnboardingStep(user)

  if (currentStep === 'complete') {
    return null // Fully onboarded
  }

  const step = onboardingSteps.find(s => s.key === currentStep)
  return step?.path || null
}

/**
 * Check if user has an active subscription
 */
export function hasActiveSubscription(user: any): boolean {
  // Check the new database fields
  return user?.hasActiveSubscription === true || user?.subscriptionStatus === 'active'
}

/**
 * Check if user can access a specific path based on their onboarding state
 */
export function canAccessPath(user: any, path: string): boolean {
  const currentStep = getCurrentOnboardingStep(user)
  const currentStepIndex = onboardingSteps.findIndex(s => s.key === currentStep)
  const pathStepIndex = onboardingSteps.findIndex(s => s.path === path)

  // If path is not an onboarding step, allow access if fully onboarded
  if (pathStepIndex === -1) {
    return currentStep === 'complete'
  }

  // Allow access to current step and previous steps
  return pathStepIndex <= currentStepIndex
}

/**
 * Get onboarding progress percentage
 */
export function getOnboardingProgress(user: any): number {
  const currentStep = getCurrentOnboardingStep(user)
  const currentStepIndex = onboardingSteps.findIndex(s => s.key === currentStep)

  if (currentStepIndex === -1) return 0

  // Calculate progress (complete step gets 100%)
  if (currentStep === 'complete') return 100

  return Math.round((currentStepIndex / (onboardingSteps.length - 1)) * 100)
}

/**
 * Get the next onboarding step
 */
export function getNextOnboardingStep(user: any): OnboardingStep | null {
  const currentStep = getCurrentOnboardingStep(user)
  const currentStepIndex = onboardingSteps.findIndex(s => s.key === currentStep)

  if (currentStepIndex === -1 || currentStepIndex >= onboardingSteps.length - 1) {
    return null
  }

  return onboardingSteps[currentStepIndex + 1] || null
}

/**
 * Check if a path is part of the onboarding flow
 */
export function isOnboardingPath(path: string): boolean {
  return onboardingSteps.some(step => step.path === path)
}

/**
 * Get user-friendly status message
 */
export function getOnboardingStatusMessage(user: any): string {
  const currentStep = getCurrentOnboardingStep(user)

  switch (currentStep) {
    case 'verification':
      return 'Please verify your email address to continue'
    case 'subscription':
      return 'Choose a subscription plan to get started'
    case 'setup':
      return 'Complete your profile setup'
    case 'complete':
      return 'Welcome to QuickMeazure!'
    default:
      return 'Complete your account setup'
  }
}
