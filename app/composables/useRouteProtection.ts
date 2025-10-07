import {
  isPublicRoute,
  requiresSetup as routeRequiresSetup,
  getAuthRedirect,
} from '~/utils/route-protection'

// Composable for route protection and auth state management
export const useRouteProtection = () => {
  const { user, isAuthenticated } = useAuth()
  const route = useRoute()

  // Check if current route requires authentication
  const requiresAuth = computed(() => {
    return !isPublicRoute(route.path)
  })

  // Check if current route requires setup completion
  const requiresSetup = computed(() => {
    return routeRequiresSetup(route.path)
  })

  // Check if user can access current route
  const canAccessRoute = computed(() => {
    const hasCompletedSetup = user.value?.hasCompletedSetup !== false

    const redirectPath = getAuthRedirect(route.path, isAuthenticated.value, hasCompletedSetup)

    return !redirectPath
  })

  // Get appropriate redirect path if user can't access current route
  const getRedirectPath = () => {
    const hasCompletedSetup = user.value?.hasCompletedSetup !== false

    return getAuthRedirect(route.path, isAuthenticated.value, hasCompletedSetup)
  }

  // Navigate to appropriate route based on auth state
  const navigateToAppropriateRoute = async () => {
    const redirectPath = getRedirectPath()
    if (redirectPath) {
      await navigateTo(redirectPath)
    }
  }

  return {
    requiresAuth,
    requiresSetup,
    canAccessRoute,
    getRedirectPath,
    navigateToAppropriateRoute,
  }
}
