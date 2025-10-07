// Guest-only middleware for auth pages when user is already authenticated
export default defineNuxtRouteMiddleware(async () => {
  // Skip middleware on server-side
  if (import.meta.server) return

  const { isAuthenticated, init, requiredOnboardingPath } = useAuth()

  // Initialize auth state if not already done
  await init()

  // If user is authenticated, redirect to appropriate onboarding step or dashboard
  if (isAuthenticated.value) {
    const nextPath = requiredOnboardingPath.value || '/dashboard'
    return navigateTo(nextPath)
  }
})
