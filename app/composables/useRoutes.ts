import {
  ROUTE_NAMES,
  ROUTE_PATHS,
  getRoutePath,
  navigateToRoute,
  type RouteName,
  type NavigationOptions,
} from '../../constants/routes'

export function useAppRoutes() {
  // Helper to get route path
  const getPath = <T extends RouteName>(
    name: T,
    ...args: T extends keyof Parameters<typeof getRoutePath>[1]
      ? [Parameters<typeof getRoutePath<T>>[1]]
      : []
  ): string => {
    return getRoutePath(name, ...(args as [unknown]))
  }

  // Type-safe navigation
  const navigate = <T extends RouteName>(
    options: NavigationOptions<T>,
    navigateOptions?: Parameters<typeof navigateToRoute>[1]
  ) => {
    return navigateToRoute(options, navigateOptions)
  }

  return {
    // Route names
    ROUTE_NAMES,

    // Route paths
    ROUTE_PATHS,

    // Methods
    getPath,
    navigate,
  }
}
