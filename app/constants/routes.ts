// Route names should be unique across the application
export const ROUTE_NAMES = {
  // Public routes
  HOME: '/',

  // Auth routes
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CONFIRM: '/auth/confirm',
    SETUP_MEASUREMENT: '/auth/setup-measurement',
  },

  // Dashboard routes
  DASHBOARD: {
    INDEX: '/dashboard',
    CLIENTS: {
      INDEX: '/clients',
      NEW: '/clients/new',
      EDIT: '/clients/:id/edit',
      VIEW: '/clients/:id',
    },
    ORDERS: {
      INDEX: '/orders',
      NEW: '/orders/new',
      EDIT: '/orders/:id/edit',
      VIEW: '/orders/:id',
    },
    STYLES: {
      INDEX: '/styles',
      NEW: '/styles/new',
      EDIT: '/styles/:id/edit',
      VIEW: '/styles/:id',
    },
    SETTINGS: '/settings',
  },

  // Legal routes
  LEGAL: {
    TERMS: '/legal/terms',
    PRIVACY: '/legal/privacy',
  },
} as const

// Type for route names
export type RouteName =
  | typeof ROUTE_NAMES.HOME
  | ValueOf<typeof ROUTE_NAMES.AUTH>
  | ValueOf<typeof ROUTE_NAMES.DASHBOARD>
  | ValueOf<typeof ROUTE_NAMES.LEGAL>

// Helper type to get values of an object type
type ValueOf<T> = T[keyof T]

// Route paths with parameters
type RouteParams = {
  [ROUTE_NAMES.AUTH.RESET_PASSWORD]: { token: string }
  [ROUTE_NAMES.DASHBOARD.CLIENTS.EDIT]: { id: string }
  [ROUTE_NAMES.DASHBOARD.CLIENTS.VIEW]: { id: string }
  [ROUTE_NAMES.DASHBOARD.ORDERS.EDIT]: { id: string }
  [ROUTE_NAMES.DASHBOARD.ORDERS.VIEW]: { id: string }
  [ROUTE_NAMES.DASHBOARD.STYLES.EDIT]: { id: string }
  [ROUTE_NAMES.DASHBOARD.STYLES.VIEW]: { id: string }
}

// Type-safe route path builder
type RoutePath<T extends RouteName> = T extends keyof RouteParams
  ? (params: RouteParams[T]) => string
  : string

// Route paths configuration
export const ROUTE_PATHS: { [K in RouteName]: RoutePath<K> } = {
  // Public routes
  [ROUTE_NAMES.HOME]: '/',

  // Legal routes
  [ROUTE_NAMES.LEGAL.TERMS]: '/legal/terms',
  [ROUTE_NAMES.LEGAL.PRIVACY]: '/legal/privacy',

  // Auth routes
  [ROUTE_NAMES.AUTH.LOGIN]: '/auth/login',
  [ROUTE_NAMES.AUTH.REGISTER]: '/auth/register',
  [ROUTE_NAMES.AUTH.FORGOT_PASSWORD]: '/auth/forgot-password',
  [ROUTE_NAMES.AUTH.RESET_PASSWORD]: (params: { token: string }) =>
    `/auth/reset-password/${params.token}`,
  [ROUTE_NAMES.AUTH.CONFIRM]: '/auth/confirm',

  // Dashboard routes
  [ROUTE_NAMES.DASHBOARD.INDEX]: '/dashboard',
  [ROUTE_NAMES.DASHBOARD.SETTINGS]: '/settings',

  // Client routes
  [ROUTE_NAMES.DASHBOARD.CLIENTS.INDEX]: '/clients',
  [ROUTE_NAMES.DASHBOARD.CLIENTS.NEW]: '/clients/new',
  [ROUTE_NAMES.DASHBOARD.CLIENTS.EDIT]: (params: { id: string }) => `/clients/${params.id}/edit`,
  [ROUTE_NAMES.DASHBOARD.CLIENTS.VIEW]: (params: { id: string }) => `/clients/${params.id}`,

  // Order routes
  [ROUTE_NAMES.DASHBOARD.ORDERS.INDEX]: '/orders',
  [ROUTE_NAMES.DASHBOARD.ORDERS.NEW]: '/orders/new',
  [ROUTE_NAMES.DASHBOARD.ORDERS.EDIT]: (params: { id: string }) => `/orders/${params.id}/edit`,
  [ROUTE_NAMES.DASHBOARD.ORDERS.VIEW]: (params: { id: string }) => `/orders/${params.id}`,

  // Style routes
  [ROUTE_NAMES.DASHBOARD.STYLES.INDEX]: '/styles',
  [ROUTE_NAMES.DASHBOARD.STYLES.NEW]: '/styles/new',
  [ROUTE_NAMES.DASHBOARD.STYLES.EDIT]: (params: { id: string }) => `/styles/${params.id}/edit`,
  [ROUTE_NAMES.DASHBOARD.STYLES.VIEW]: (params: { id: string }) => `/styles/${params.id}`,

  // Legal routes
  [ROUTE_NAMES.LEGAL.TERMS]: '/legal/terms',
  [ROUTE_NAMES.LEGAL.PRIVACY]: '/legal/privacy',
} as const

// Helper function to get route path with type safety
export function getRoutePath<T extends RouteName>(
  name: T,
  ...args: T extends keyof RouteParams ? [RouteParams[T]] : []
): string {
  const path = ROUTE_PATHS[name]
  return typeof path === 'function' ? path(args[0]) : path
}

// Type for navigation options
export interface NavigationOptions<T extends RouteName> {
  name: T
  params?: T extends keyof RouteParams ? RouteParams[T] : never
  query?: Record<string, string | number | boolean | null | undefined>
  hash?: string
}

// Type-safe navigation function
export function navigateToRoute<T extends RouteName>(
  options: NavigationOptions<T>,
  navigateOptions?: Parameters<typeof navigateTo>[1]
) {
  const { name, params, ...rest } = options
  const path = getRoutePath(name, params as any)
  return navigateTo(
    {
      path,
      ...rest,
    },
    navigateOptions
  )
}
