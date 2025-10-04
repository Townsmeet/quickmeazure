import { useAuthStore } from '~/store/modules/auth'
import { useLayout } from '~/composables/useLayout'

export default defineNuxtRouteMiddleware(to => {
  // Use auth store for authentication state
  const authStore = useAuthStore()
  const { setLayout } = useLayout()

  // Define which paths should use which layouts
  // By default, auth routes use auth layout
  if (to.path.startsWith('/auth/')) {
    setLayout('auth')
    return
  }

  // Public pages can use default layout
  if (to.path === '/' || to.path.startsWith('/legal/')) {
    setLayout('default')
    return
  }

  // Path-based fallback for dashboard routes - ensure dashboard layout
  // for these routes even if auth state has issues
  const dashboardPaths = [
    '/dashboard',
    '/clients',
    '/styles',
    '/orders',
    '/profile',
    '/settings',
    '/subscription',
  ]

  // Check if current path starts with any of the dashboard paths
  const isDashboardRoute = dashboardPaths.some(path => to.path.startsWith(path))

  // Always use dashboard layout for dashboard routes, regardless of auth state
  if (isDashboardRoute) {
    setLayout('dashboard')
    return
  }

  // Dashboard and authenticated routes
  if (authStore.isLoggedIn) {
    // All authenticated routes use dashboard layout
    // Only set if not already specified in the page meta
    if (!to.meta.layout) {
      setLayout('dashboard')
    }
    return
  }

  // For any other routes, if user is not logged in, use default layout
  setLayout('default')
})
