export default defineNuxtRouteMiddleware(async to => {
  // Skip middleware on server-side
  if (import.meta.server) return

  const { isAuthenticated, init, requiredOnboardingPath, canUserAccessPath, isFullyOnboarded } =
    useAuth()

  // Initialize auth state if not already done
  await init()

  // Helper function to determine if a route is public
  const isPublicRoute = (path: string): boolean => {
    // These routes are accessible without authentication
    const publicRoutes = [
      '/',
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/auth/verify-email',
      '/auth/verify-callback',
      '/auth/verify-error',
      '/auth/resend-verification',
      '/legal/terms',
      '/legal/privacy',
    ]

    // Check if the path starts with any of these prefixes
    const publicPrefixes = ['/legal/', '/api/']

    // Check exact matches
    if (publicRoutes.includes(path)) {
      return true
    }

    // Check prefixes
    return publicPrefixes.some(prefix => path.startsWith(prefix))
  }

  // Helper function to determine if a route requires authentication
  const isAuthenticatedRoute = (path: string): boolean => {
    // These routes require authentication
    const authPrefixes = [
      '/dashboard',
      '/clients',
      '/measurements',
      '/orders',
      '/styles',
      '/settings',
      '/profile',
      '/auth/confirm',
      '/auth/setup-measurements',
    ]

    return authPrefixes.some(prefix => path.startsWith(prefix))
  }

  // Skip for public routes
  if (isPublicRoute(to.path)) {
    // If user is authenticated and trying to access auth pages, handle smart redirects
    if (isAuthenticated.value && to.path.startsWith('/auth/')) {
      // Allow access to onboarding pages if user needs them
      if (canUserAccessPath(to.path)) {
        return
      }

      // Redirect to appropriate onboarding step or dashboard
      const nextPath = requiredOnboardingPath.value || '/dashboard'
      return navigateTo(nextPath)
    }
    return
  }

  // If the user isn't authenticated, redirect to login
  if (!isAuthenticated.value) {
    // Preserve the original requested URL for redirection after login
    const redirectTo = encodeURIComponent(to.fullPath)
    return navigateTo(`/auth/login?redirect=${redirectTo}`)
  }

  // Check if user needs to complete onboarding steps
  const nextOnboardingPath = requiredOnboardingPath.value
  if (nextOnboardingPath && to.path !== nextOnboardingPath) {
    // Allow access to current and previous onboarding steps
    if (!canUserAccessPath(to.path)) {
      return navigateTo(nextOnboardingPath)
    }
  }

  // If user is fully onboarded but trying to access onboarding pages
  if (
    isFullyOnboarded.value &&
    (to.path === '/auth/confirm' ||
      to.path === '/auth/setup-measurements' ||
      to.path === '/auth/verify-email')
  ) {
    return navigateTo('/dashboard')
  }

  // Set dashboard layout for authenticated routes
  if (isAuthenticatedRoute(to.path) && !to.meta.layout) {
    to.meta.layout = 'dashboard' as any
  }
})
