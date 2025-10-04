/**
 * This middleware is disabled to prevent refreshing on every navigation
 * Token refresh is now handled by the API interceptor when a 401 is received
 */
export default defineNuxtRouteMiddleware(async _to => {
  // This middleware is now disabled to prevent refreshing on every navigation
  // Token refresh is now handled by the API interceptor when a 401 is received
  return
})
