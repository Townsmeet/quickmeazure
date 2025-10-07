// Middleware for routes that require user setup completion
export default defineNuxtRouteMiddleware(async () => {
  // Skip middleware on server-side
  if (import.meta.server) return

  const { isAuthenticated, user, init } = useAuth()

  // Initialize auth state if not already done
  await init()

  // If user is not authenticated, redirect to login
  if (!isAuthenticated.value) {
    return navigateTo('/auth/login')
  }

  // If user hasn't completed setup, redirect to setup flow
  if (user.value?.hasCompletedSetup === false) {
    return navigateTo('/auth/confirm')
  }
})
