// Strict auth middleware for routes that absolutely require authentication
export default defineNuxtRouteMiddleware(async to => {
  // Skip middleware on server-side
  if (import.meta.server) return

  const { isAuthenticated, init } = useAuth()

  // Initialize auth state if not already done
  await init()

  // If the user isn't authenticated, redirect to login
  if (!isAuthenticated.value) {
    // Preserve the original requested URL for redirection after login
    const redirectTo = encodeURIComponent(to.fullPath)
    return navigateTo(`/auth/login?redirect=${redirectTo}`)
  }
})
