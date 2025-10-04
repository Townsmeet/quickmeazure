import { useAuthStore } from '~/store/modules/auth'

export default defineNuxtRouteMiddleware(to => {
  if (import.meta.server) return // Skip middleware on server-side

  console.log('Auth middleware running for route:', to.path)
  const authStore = useAuthStore()

  // Skip for public routes
  if (isPublicRoute(to.path)) {
    return
  }

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
})

// Helper function to determine if a route is public
function isPublicRoute(path: string): boolean {
  // These routes are accessible without authentication
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/setup-measurements',
    '/legal/terms',
    '/legal/privacy',
  ]

  // Check if the path starts with any of these prefixes
  const publicPrefixes = ['/auth/', '/legal/']

  // Check exact matches
  if (publicRoutes.includes(path)) {
    return true
  }

  // Check prefixes
  return publicPrefixes.some(prefix => path.startsWith(prefix))
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
