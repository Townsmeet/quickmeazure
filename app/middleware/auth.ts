export default defineNuxtRouteMiddleware(to => {
  if (import.meta.server) return // Skip middleware on server-side

  console.log(
    '🔒 AUTH MIDDLEWARE TEMPORARILY DISABLED - ALLOWING ALL ROUTES:',
    to.path,
    'FULL PATH:',
    to.fullPath
  )

  // TEMPORARILY ALLOW ALL REQUESTS TO PASS
  // This is to debug the verify-callback redirect issue
  return

  // TODO: Re-enable auth middleware after debugging
  /*
  import { useAuthStore } from '~/store/modules/auth'
  
  const authStore = useAuthStore()

  // Skip for public routes
  if (isPublicRoute(to.path)) {
    console.log('Route is public, skipping auth check:', to.path)
    return
  }

  console.log('Route is not public, checking authentication:', {
    path: to.path,
    isLoggedIn: authStore.isLoggedIn,
    hasToken: !!authStore.token,
    hasUser: !!authStore.user
  })

  // If the user isn't authenticated, redirect to login
  if (!authStore.isLoggedIn) {
    console.log('No auth token found, redirecting to login')

    // Preserve the original requested URL for redirection after login
    const redirectTo = encodeURIComponent(to.fullPath)
    return navigateTo(`/auth/login?redirect=${redirectTo}`)
  }

  // Check if user needs to complete setup
  const user = authStore.user

  // Add detailed logging for debugging
  console.log('Auth middleware - User state:', {
    path: to.path,
    userId: user?.id,
    hasCompletedSetup: user?.hasCompletedSetup,
    isSetupPage: to.path === '/auth/setup-measurements',
    isDashboard: to.path === '/dashboard',
  })

  // Special case: If we're coming from setup-measurements and going to dashboard,
  // allow it regardless of hasCompletedSetup status (which might not be updated yet)
  const fromSetup = document.referrer.includes('/auth/setup-measurements')
  if (fromSetup && to.path === '/dashboard') {
    console.log('Coming from setup page to dashboard, allowing navigation')
    return
  }

  // Regular check for setup completion
  if (user && user.hasCompletedSetup === false && to.path !== '/auth/setup-measurements') {
    console.log('User needs to complete setup, redirecting to setup page')
    return navigateTo('/auth/setup-measurements')
  }

  // If we're on a dashboard or other authenticated route, ensure we use the dashboard layout
  if (!to.meta.layout && isAuthenticatedRoute(to.path)) {
    to.meta.layout = 'dashboard'
  }

  console.log('User authenticated, proceeding to route')

  // Helper function to determine if a route is public
  function isPublicRoute(path: string): boolean {
    // These routes are accessible without authentication
    const publicRoutes = [
      '/',
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/setup-measurements',
      '/auth/verify-callback',
      '/auth/verify-email',
      '/legal/terms',
      '/legal/privacy',
    ]

    // Check if the path starts with any of these prefixes
    const publicPrefixes = ['/auth/', '/legal/']

    console.log('Checking if route is public:', { path, publicRoutes, publicPrefixes })

    // Check exact matches
    if (publicRoutes.includes(path)) {
      console.log('Route is public (exact match):', path)
      return true
    }

    // Check prefixes
    const isPublic = publicPrefixes.some(prefix => path.startsWith(prefix))
    console.log('Route public status (prefix check):', { path, isPublic })
    return isPublic
  }

  // Helper function to determine if a route requires authentication
  function isAuthenticatedRoute(path: string): boolean {
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
  */
})
