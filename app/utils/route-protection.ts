// Route protection utilities
export interface RouteConfig {
  path: string
  requiresAuth: boolean
  requiresSetup: boolean
  guestOnly: boolean
  layout?: string
}

// Define route configurations
export const routeConfigs: RouteConfig[] = [
  // Public routes
  { path: '/', requiresAuth: false, requiresSetup: false, guestOnly: false },
  { path: '/legal/terms', requiresAuth: false, requiresSetup: false, guestOnly: false },
  { path: '/legal/privacy', requiresAuth: false, requiresSetup: false, guestOnly: false },

  // Guest-only routes (auth pages)
  {
    path: '/auth/login',
    requiresAuth: false,
    requiresSetup: false,
    guestOnly: true,
    layout: 'auth',
  },
  {
    path: '/auth/register',
    requiresAuth: false,
    requiresSetup: false,
    guestOnly: true,
    layout: 'auth',
  },
  {
    path: '/auth/forgot-password',
    requiresAuth: false,
    requiresSetup: false,
    guestOnly: true,
    layout: 'auth',
  },
  {
    path: '/auth/reset-password',
    requiresAuth: false,
    requiresSetup: false,
    guestOnly: true,
    layout: 'auth',
  },

  // Auth-only routes (no setup required)
  {
    path: '/auth/verify-email',
    requiresAuth: false,
    requiresSetup: false,
    guestOnly: false,
    layout: 'auth',
  },
  {
    path: '/auth/verify-callback',
    requiresAuth: false,
    requiresSetup: false,
    guestOnly: false,
    layout: 'auth',
  },
  {
    path: '/auth/verify-error',
    requiresAuth: false,
    requiresSetup: false,
    guestOnly: false,
    layout: 'auth',
  },
  {
    path: '/auth/resend-verification',
    requiresAuth: false,
    requiresSetup: false,
    guestOnly: false,
    layout: 'auth',
  },
  {
    path: '/auth/confirm',
    requiresAuth: true,
    requiresSetup: false,
    guestOnly: false,
    layout: 'auth',
  },
  {
    path: '/auth/setup-measurements',
    requiresAuth: true,
    requiresSetup: false,
    guestOnly: false,
    layout: 'auth',
  },

  // Protected routes (require auth + setup)
  {
    path: '/dashboard',
    requiresAuth: true,
    requiresSetup: true,
    guestOnly: false,
    layout: 'dashboard',
  },
  {
    path: '/clients',
    requiresAuth: true,
    requiresSetup: true,
    guestOnly: false,
    layout: 'dashboard',
  },
  {
    path: '/orders',
    requiresAuth: true,
    requiresSetup: true,
    guestOnly: false,
    layout: 'dashboard',
  },
  {
    path: '/styles',
    requiresAuth: true,
    requiresSetup: true,
    guestOnly: false,
    layout: 'dashboard',
  },
  {
    path: '/settings',
    requiresAuth: true,
    requiresSetup: true,
    guestOnly: false,
    layout: 'dashboard',
  },
  {
    path: '/measurements',
    requiresAuth: true,
    requiresSetup: true,
    guestOnly: false,
    layout: 'dashboard',
  },
  {
    path: '/measurement-templates',
    requiresAuth: true,
    requiresSetup: true,
    guestOnly: false,
    layout: 'dashboard',
  },
  {
    path: '/activity',
    requiresAuth: true,
    requiresSetup: true,
    guestOnly: false,
    layout: 'dashboard',
  },
]

// Helper functions
export const isPublicRoute = (path: string): boolean => {
  const config = routeConfigs.find(
    route => path === route.path || path.startsWith(route.path + '/')
  )
  return config ? !config.requiresAuth : false
}

export const isGuestOnlyRoute = (path: string): boolean => {
  const config = routeConfigs.find(
    route => path === route.path || path.startsWith(route.path + '/')
  )
  return config ? config.guestOnly : false
}

export const requiresSetup = (path: string): boolean => {
  const config = routeConfigs.find(
    route => path === route.path || path.startsWith(route.path + '/')
  )
  return config ? config.requiresSetup : false
}

export const getRouteLayout = (path: string): string | undefined => {
  const config = routeConfigs.find(
    route => path === route.path || path.startsWith(route.path + '/')
  )
  return config?.layout
}

// Check if user needs to be redirected based on their auth state
export const getAuthRedirect = (
  path: string,
  isAuthenticated: boolean,
  hasCompletedSetup: boolean
): string | null => {
  const config = routeConfigs.find(
    route => path === route.path || path.startsWith(route.path + '/')
  )

  if (!config) {
    // Unknown route, treat as protected
    if (!isAuthenticated) {
      return `/auth/login?redirect=${encodeURIComponent(path)}`
    }
    if (!hasCompletedSetup) {
      return '/auth/confirm'
    }
    return null
  }

  // Guest-only routes
  if (config.guestOnly && isAuthenticated) {
    return hasCompletedSetup ? '/dashboard' : '/auth/confirm'
  }

  // Protected routes
  if (config.requiresAuth && !isAuthenticated) {
    return `/auth/login?redirect=${encodeURIComponent(path)}`
  }

  // Setup-required routes
  if (config.requiresSetup && isAuthenticated && !hasCompletedSetup) {
    return '/auth/confirm'
  }

  // Setup/confirm pages when already completed
  if (
    isAuthenticated &&
    hasCompletedSetup &&
    (path === '/auth/confirm' || path === '/auth/setup-measurements')
  ) {
    return '/dashboard'
  }

  return null
}
